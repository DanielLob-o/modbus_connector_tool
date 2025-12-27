package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/simonvetter/modbus"
)

type ModbusController struct {
	ctx    context.Context
	client *modbus.ModbusClient
}

func NewModbusController() *ModbusController {
	return &ModbusController{}
}

func (c *ModbusController) startup(ctx context.Context) {
	c.ctx = ctx
}

func (c *ModbusController) ConnectTCP(address string) string {
	url := "tcp://" + address
	if len(address) > 6 && address[:6] == "tcp://" {
		url = address
	}

	conf := &modbus.ClientConfiguration{
		URL:     url,
		Timeout: 10 * time.Second,
	}

	client, err := modbus.NewClient(conf)
	if err != nil {
		log.Printf("Error creating TCP client: %v", err)
		return fmt.Sprintf("Error: %v", err)
	}

	err = client.Open()
	if err != nil {
		log.Printf("Error opening TCP connection: %v", err)
		return fmt.Sprintf("Error: %v", err)
	}

	c.client = client
	return "Connected to " + address
}

func (c *ModbusController) ConnectRTU(address string, baudRate int, dataBits int, stopBits int, parity string) string {
	var p uint
	switch parity {
	case "E":
		p = modbus.PARITY_EVEN
	case "O":
		p = modbus.PARITY_ODD
	default:
		p = modbus.PARITY_NONE
	}

	url := "rtu://" + address

	conf := &modbus.ClientConfiguration{
		URL:      url,
		Speed:    uint(baudRate),
		DataBits: uint(dataBits),
		StopBits: uint(stopBits),
		Parity:   p,
		Timeout:  10 * time.Second,
	}

	log.Printf("Attempting RTU Connect (simonvetter): URL=%s, Baud=%d, Data=%d, Stop=%d, Parity=%d", 
		url, baudRate, dataBits, stopBits, p)

	client, err := modbus.NewClient(conf)
	if err != nil {
		log.Printf("Error creating RTU client: %v", err)
		return fmt.Sprintf("Error: %v", err)
	}

	err = client.Open()
	if err != nil {
		log.Printf("Error opening RTU connection: %v", err)
		return fmt.Sprintf("Error: %v", err)
	}

	c.client = client
	return "Connected to " + address
}

func (c *ModbusController) Disconnect() string {
	if c.client != nil {
		err := c.client.Close()
		c.client = nil
		if err != nil {
			return fmt.Sprintf("Error disconnecting: %v", err)
		}
		return "Disconnected"
	}
	return "No active connection"
}

func (c *ModbusController) checkClient() error {
	if c.client == nil {
		return fmt.Errorf("client not connected")
	}
	return nil
}

// Helpers for conversion
func boolsToBytes(bools []bool) []byte {
	// Pack bits into bytes
	// Modbus spec: 1 bit per coil, packed 8 per byte, LSB first?
	// Actually goburrow returned them packed. 
	// We need to match that behavior.
	byteLen := (len(bools) + 7) / 8
	bytes := make([]byte, byteLen)
	for i, b := range bools {
		if b {
			byteIndex := i / 8
			bitIndex := uint(i % 8)
			bytes[byteIndex] |= (1 << bitIndex)
		}
	}
	return bytes
}

func uint16sToBytes(regs []uint16) []byte {
	// Big Endian
	bytes := make([]byte, len(regs)*2)
	for i, r := range regs {
		bytes[i*2] = byte(r >> 8)
		bytes[i*2+1] = byte(r)
	}
	return bytes
}

func (c *ModbusController) ReadCoils(address int, quantity int) ([]byte, error) {
	if err := c.checkClient(); err != nil { return nil, err }
	// Expecting []bool
	bools, err := c.client.ReadCoils(uint16(address), uint16(quantity))
	if err != nil { return nil, err }
	return boolsToBytes(bools), nil
}

func (c *ModbusController) ReadDiscreteInputs(address int, quantity int) ([]byte, error) {
	if err := c.checkClient(); err != nil { return nil, err }
	bools, err := c.client.ReadDiscreteInputs(uint16(address), uint16(quantity))
	if err != nil { return nil, err }
	return boolsToBytes(bools), nil
}

func (c *ModbusController) ReadHoldingRegisters(address int, quantity int) ([]byte, error) {
	if err := c.checkClient(); err != nil { return nil, err }
	regs, err := c.client.ReadRegisters(uint16(address), uint16(quantity), modbus.HOLDING_REGISTER)
	if err != nil { return nil, err }
	return uint16sToBytes(regs), nil
}

func (c *ModbusController) ReadInputRegisters(address int, quantity int) ([]byte, error) {
	if err := c.checkClient(); err != nil { return nil, err }
	regs, err := c.client.ReadRegisters(uint16(address), uint16(quantity), modbus.INPUT_REGISTER)
	if err != nil { return nil, err }
	return uint16sToBytes(regs), nil
}

func (c *ModbusController) WriteSingleCoil(address int, value uint16) ([]byte, error) {
	if err := c.checkClient(); err != nil { return nil, err }
	// value 0xFF00 -> true
	boolVal := false
	if value == 0xFF00 {
		boolVal = true
	}
	err := c.client.WriteCoil(uint16(address), boolVal)
	if err != nil { return nil, err }
	
	b := make([]byte, 2)
	b[0] = byte(value >> 8)
	b[1] = byte(value)
	return b, nil
}

func (c *ModbusController) WriteSingleRegister(address int, value uint16) ([]byte, error) {
	if err := c.checkClient(); err != nil { return nil, err }
	err := c.client.WriteRegister(uint16(address), value)
	if err != nil { return nil, err }
	
	b := make([]byte, 2)
	b[0] = byte(value >> 8)
	b[1] = byte(value)
	return b, nil
}

func (c *ModbusController) WriteMultipleCoils(address int, quantity int, values []byte) ([]byte, error) {
	if err := c.checkClient(); err != nil { return nil, err }
	
	bools := make([]bool, quantity)
	for i := 0; i < int(quantity); i++ {
		byteIndex := i / 8
		bitIndex := uint(i % 8)
		if byteIndex < len(values) {
			if (values[byteIndex] & (1 << bitIndex)) != 0 {
				bools[i] = true
			}
		}
	}
	
	err := c.client.WriteCoils(uint16(address), bools)
	if err != nil { return nil, err }
	return []byte("OK"), nil
}

func (c *ModbusController) WriteMultipleRegisters(address int, quantity int, values []byte) ([]byte, error) {
	if err := c.checkClient(); err != nil { return nil, err }
	
	regs := make([]uint16, quantity)
	for i := 0; i < int(quantity); i++ {
		if (i*2 + 1) < len(values) {
			regs[i] = uint16(values[i*2])<<8 | uint16(values[i*2+1])
		}
	}

	err := c.client.WriteRegisters(uint16(address), regs)
	if err != nil { return nil, err }
	return []byte("OK"), nil
}

func (c *ModbusController) MaskWriteRegister(address int, andMask int, orMask int) ([]byte, error) {
	return nil, fmt.Errorf("MaskWriteRegister not supported in new library yet")
}

func (c *ModbusController) ReadWriteMultipleRegisters(readAddress int, readQuantity int, writeAddress int, writeQuantity int, writeValues []byte) ([]byte, error) {
	return nil, fmt.Errorf("ReadWriteMultipleRegisters not supported in new library yet")
}

func (c *ModbusController) ReadFIFOQueue(address int) ([]byte, error) {
	return nil, fmt.Errorf("ReadFIFOQueue not supported in new library yet")
}
