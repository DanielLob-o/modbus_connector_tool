# Modbus Connector Tool

A robust Modbus Connector Tool built with [Wails](https://wails.io) (Go) and Angular. This application serves as a GUI wrapper for the [goburrow/modbus](https://github.com/goburrow/modbus) library, allowing users to interact with Modbus devices via TCP and Serial (RTU) protocols.

## Features

- **Connection Modes**:
  - **Modbus TCP**: Connect to devices over IP.
  - **Modbus RTU**: Connect via Serial ports (COM/TTY).
- **Supported Functions**:
  - Read Coils (0x01)
  - Read Discrete Inputs (0x02)
  - Read Holding Registers (0x03)
  - Read Input Registers (0x04)
  - Write Single Coil (0x05)
  - Write Single Register (0x06)
  - Write Multiple Coils (0x0F)
  - Write Multiple Registers (0x10)
  - Mask Write Register (0x16)
  - Read/Write Multiple Registers (0x17)
  - Read FIFO Queue (0x18)
- **UI**:
  - Clean Angular-based interface with Dark/Light theme support.
  - Real-time connection status.
  - Data visualization (Hex/Decimal/Binary).
  - Integrated E2E Test Runner for automated verification.

## Prerequisites

- **Go**: v1.22+
- **Node.js**: v18+
- **Wails**: v2.11.0+

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/DanielLob-o/modbus_connector_tool.git
   cd modbus_connector_tool
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Run the application in development mode:
   ```bash
   wails dev
   ```

## Production Build

To build the application for production:

```bash
wails build
```

The binary will be generated in the `build/bin` directory.

## License

MIT
