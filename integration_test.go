package main

import (
	"testing"
)

func TestIntegration(t *testing.T) {
	address := "127.0.0.1:5020"

	controller := NewModbusController()
	res := controller.ConnectTCP(address)
	if res != "Connected to "+address {
		t.Fatalf("Failed to connect: %s", res)
	}
	defer controller.Disconnect()

	t.Logf("Connected to %s", address)

	t.Run("ReadCoils", func(t *testing.T) {
		bytes, err := controller.ReadCoils(0, 8)
		if err != nil {
			t.Fatalf("ReadCoils failed: %v", err)
		}
		t.Logf("ReadCoils(0, 8) = %v", bytes)
		if len(bytes) == 0 {
			t.Errorf("Expected bytes but got empty")
		}
	})

	t.Run("ReadHoldingRegisters", func(t *testing.T) {
		bytes, err := controller.ReadHoldingRegisters(0, 5) 
		if err != nil {
			t.Fatalf("ReadHoldingRegisters failed: %v", err)
		}
		t.Logf("ReadHoldingRegisters(0, 5) = %v", bytes)
		if len(bytes) != 10 {
			t.Errorf("Expected 10 bytes, got %d", len(bytes))
		}
	})
    
    t.Run("WriteSingleCoil", func(t *testing.T) {
        _, err := controller.WriteSingleCoil(10, 0xFF00)
        if err != nil {
             t.Fatalf("WriteSingleCoil failed: %v", err)
        }
        
        bytes, err := controller.ReadCoils(10, 1)
        if err != nil {
             t.Fatalf("Read checking WriteSingleCoil failed: %v", err)
        }
        t.Logf("ReadCoil(10) after Write = %v", bytes)
    })
    
    t.Run("WriteSingleRegister", func(t *testing.T) {
        _, err := controller.WriteSingleRegister(10, 12345)
        if err != nil {
             t.Fatalf("WriteSingleRegister failed: %v", err)
        }
        bytes, err := controller.ReadHoldingRegisters(10, 1)
        if err != nil {
             t.Fatalf("Read checking WriteSingleRegister failed: %v", err)
        }
         t.Logf("ReadReg(10) after Write = %v", bytes)
         if len(bytes) == 2 {
             val := uint16(bytes[0])<<8 | uint16(bytes[1])
             if val != 12345 {
                 t.Errorf("Expected 12345, got %d", val)
             }
         }
    })

}
