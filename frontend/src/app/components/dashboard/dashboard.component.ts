import { Component } from '@angular/core';
import { ModbusService } from '../../services/modbus.service';
import { Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';

interface LogEntry {
    time: string;
    type: string;
    message: string;
    error?: boolean;
}

interface ParsedResult {
    address: string;
    value: any;
    hex: string;
    binary: string;
}

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
    operation: string = 'ReadCoils';

    address: number = 0;
    quantity: number = 1;
    singleValue: number = 0;
    multiValuesStr: string = '';

    logs: LogEntry[] = [];
    parsedResults: ParsedResult[] = [];

    constructor(private modbusService: ModbusService, private router: Router, public themeService: ThemeService) { }

    toggleTheme() {
        this.themeService.toggleTheme();
    }

    getOperationTitle() {
        return this.operation.replace(/([A-Z])/g, ' $1').trim();
    }

    isReadOperation() {
        return this.operation.startsWith('Read');
    }

    isWriteMulti() {
        return this.operation.includes('Multi');
    }

    addLog(type: string, message: string, error: boolean = false) {
        const time = new Date().toLocaleTimeString();
        this.logs.unshift({ time, type, message, error });
    }

    async disconnect() {
        await this.modbusService.disconnect();
        this.router.navigate(['/']);
    }

    async execute() {
        try {
            let res: number[];
            this.parsedResults = [];
            const op = this.operation;
            this.addLog('REQ', `${op} Addr:${this.address} ${this.isReadOperation() ? 'Qty:' + this.quantity : ''}`);

            switch (op) {
                case 'ReadCoils':
                case 'ReadDiscrete':
                    res = op === 'ReadCoils'
                        ? await this.modbusService.readCoils(this.address, this.quantity)
                        : await this.modbusService.readDiscreteInputs(this.address, this.quantity);
                    this.addLog('RES', `[${res.join(', ')}]`);
                    this.parseBitResults(res);
                    break;
                case 'ReadHolding':
                case 'ReadInput':
                    res = op === 'ReadHolding'
                        ? await this.modbusService.readHoldingRegisters(this.address, this.quantity)
                        : await this.modbusService.readInputRegisters(this.address, this.quantity);
                    this.addLog('RES', `[${res.join(', ')}]`);
                    this.parseRegisterResults(res);
                    break;
                case 'WriteSingleCoil':
                    res = await this.modbusService.writeSingleCoil(this.address, this.singleValue);
                    this.addLog('RES', `OK. ${JSON.stringify(res)}`);
                    break;
                case 'WriteSingleReg':
                    res = await this.modbusService.writeSingleRegister(this.address, this.singleValue);
                    this.addLog('RES', `OK. ${JSON.stringify(res)}`);
                    break;
                case 'WriteMultiCoils':
                    const coilVals = this.multiValuesStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                    res = await this.modbusService.writeMultipleCoils(this.address, coilVals);
                    this.addLog('RES', `OK. ${JSON.stringify(res)}`);
                    break;
                case 'WriteMultiRegs':
                    const regVals = this.multiValuesStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                    res = await this.modbusService.writeMultipleRegisters(this.address, regVals);
                    this.addLog('RES', `OK. ${JSON.stringify(res)}`);
                    break;
                default:
                    this.addLog('ERR', 'Unknown operation', true);
            }
        } catch (e) {
            this.addLog('ERR', String(e), true);
        }
    }

    parseBitResults(bytes: number[]) {
        let currentAddr = this.address;
        let bitsProcessed = 0;

        for (let i = 0; i < bytes.length; i++) {
            const byteVal = bytes[i];
            for (let bit = 0; bit < 8; bit++) {
                if (bitsProcessed >= this.quantity) break;

                const val = (byteVal >> bit) & 1;
                this.parsedResults.push({
                    address: String(currentAddr),
                    value: val,
                    hex: '0x' + val.toString(16).toUpperCase(),
                    binary: val.toString(2)
                });

                currentAddr++;
                bitsProcessed++;
            }
        }
    }

    parseRegisterResults(bytes: number[]) {
        let currentAddr = this.address;
        for (let i = 0; i < bytes.length; i += 2) {
            if (i + 1 >= bytes.length) break;

            const high = bytes[i];
            const low = bytes[i + 1];
            const val = (high << 8) | low;

            this.parsedResults.push({
                address: String(currentAddr),
                value: val,
                hex: '0x' + val.toString(16).toUpperCase().padStart(4, '0'),
                binary: val.toString(2).padStart(16, '0')
            });
            currentAddr++;
        }
    }
}
