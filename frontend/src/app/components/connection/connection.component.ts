import { Component } from '@angular/core';
import { ModbusService } from '../../services/modbus.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-connection',
    templateUrl: './connection.component.html',
    styleUrls: ['./connection.component.css']
})
export class ConnectionComponent {
    mode: 'TCP' | 'RTU' = 'TCP';

    tcpAddress: string = 'localhost:5020';

    rtuAddress: string = 'COM1';
    baudRate: number = 9600;
    dataBits: number = 8;
    stopBits: number = 1;
    parity: string = 'N';

    isLoading = false;
    isConnected = false;
    statusMessage = 'Ready to connect';
    lastError = false;

    constructor(private modbusService: ModbusService, private router: Router) { }

    async connect() {
        this.isLoading = true;
        this.statusMessage = 'Connecting...';
        this.lastError = false;

        try {
            let result = '';
            if (this.mode === 'TCP') {
                result = await this.modbusService.connectTCP(this.tcpAddress);
            } else {
                result = await this.modbusService.connectRTU(
                    this.rtuAddress, this.baudRate, this.dataBits, this.stopBits, this.parity
                );
            }

            if (result.startsWith('Error')) {
                this.statusMessage = result;
                this.lastError = true;
            } else {
                this.statusMessage = result;
                this.isConnected = true;
                setTimeout(() => {
                    this.router.navigate(['/dashboard']);
                }, 1000);
            }
        } catch (e) {
            this.statusMessage = 'Exception: ' + e;
            this.lastError = true;
        } finally {
            this.isLoading = false;
        }
    }

    async disconnect() {
        const res = await this.modbusService.disconnect();
        this.isConnected = false;
        this.statusMessage = res;
    }
}
