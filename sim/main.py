import asyncio
import logging
import argparse
import sys
import serial.tools.list_ports

from pymodbus.server import StartAsyncTcpServer, StartAsyncSerialServer
from pymodbus.datastore import (
    ModbusSequentialDataBlock,
    ModbusServerContext,
    ModbusDeviceContext,
)

logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.INFO)

async def run_server(args):
    # List available ports for debugging
    ports = serial.tools.list_ports.comports()
    print("Available Ports:")
    for p in ports:
        print(f" - {p.device}: {p.description}")

    store = ModbusDeviceContext(
        hr=ModbusSequentialDataBlock(0, list(range(100))), 
        ir=ModbusSequentialDataBlock(0, list(range(1000, 1100))), 
        co=ModbusSequentialDataBlock(0, [1, 0] * 50), 
        di=ModbusSequentialDataBlock(0, [1] * 50 + [0] * 50)  
    )

    context = ModbusServerContext(devices=store, single=True)

    if args.type == 'tcp':
        print(f"--- Starting Modbus TCP Server ---")
        print(f"Listening on {args.host}:{args.port}")
        await StartAsyncTcpServer(
            context=context,
            address=(args.host, int(args.port))
        )
    elif args.type == 'rtu':
        print(f"--- Starting Modbus RTU Server ---")
        print(f"Listening on {args.port} (Baud: {args.baud})")
        
        await StartAsyncSerialServer(
            context=context,
            port=args.port,
            baudrate=int(args.baud),
            bytesize=8,
            parity='N',
            stopbits=1,
        )

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Modbus Simulator")
    parser.add_argument("--type", choices=['tcp', 'rtu'], default='tcp', help="Server type (tcp or rtu)")
    parser.add_argument("--host", default="127.0.0.1", help="Host IP (TCP only)")
    parser.add_argument("--port", default="5020", help="Port (TCP) or COM port (RTU)")
    parser.add_argument("--baud", default="9600", help="Baud rate (RTU only)")

    args = parser.parse_args()

    try:
        asyncio.run(run_server(args))
    except KeyboardInterrupt:
        print("\nServer shutting down.")
    except Exception as e:
        print(f"Error: {e}")