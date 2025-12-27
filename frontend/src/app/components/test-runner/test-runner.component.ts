import { Component } from '@angular/core';
import { ModbusService } from '../../services/modbus.service';
import { Router } from '@angular/router';

interface TestStep {
    name: string;
    status: 'PENDING' | 'RUNNING' | 'PASS' | 'FAIL';
    message: string;
}

@Component({
    selector: 'app-test-runner',
    templateUrl: './test-runner.component.html',
    styleUrls: ['./test-runner.component.css']
})
export class TestRunnerComponent {
    mode: 'TCP' | 'RTU' = 'TCP';
    tcpAddress: string = 'localhost:5020';
    rtuAddress: string = 'COM1';
    baudRate: number = 9600;

    steps: TestStep[] = [
        { name: 'Connect to Simulator', status: 'PENDING', message: '' },
        { name: 'Read Coils (Addr 0, Qty 10)', status: 'PENDING', message: '' },
        { name: 'Verify Coil Data', status: 'PENDING', message: '' },
        { name: 'Write Multi Coils (Addr 5: 1, 0, 1)', status: 'PENDING', message: '' },
        { name: 'Verify Multi Coils', status: 'PENDING', message: '' },
        { name: 'Write Multi Registers (Addr 20: 100, 200, 300)', status: 'PENDING', message: '' },
        { name: 'Verify Multi Registers', status: 'PENDING', message: '' },
        { name: 'Disconnect', status: 'PENDING', message: '' }
    ];

    isRunning = false;

    constructor(private modbusService: ModbusService, private router: Router) { }

    goBack() {
        this.router.navigate(['/dashboard']);
    }

    async runTests() {
        this.isRunning = true;
        this.resetSteps();

        try {
            // 1. Connect
            await this.runStep(0, async () => {
                let res = '';
                if (this.mode === 'TCP') {
                    res = await this.modbusService.connectTCP(this.tcpAddress);
                } else {
                    res = await this.modbusService.connectRTU(this.rtuAddress, this.baudRate, 8, 1, 'N');
                }

                if (res.startsWith('Error')) throw new Error(res);
                return res;
            });

            // 2. Read Coils
            let coils: number[] = [];
            await this.runStep(1, async () => {
                coils = await this.modbusService.readCoils(0, 10);
                return `Read ${coils.length} bytes`;
            });

            // 3. Verify Coil Data
            await this.runStep(2, async () => {
                if (!coils || coils.length === 0) throw new Error('No data received');
                return 'Data received successfully';
            });

            // 4. Write Multi Coils
            const coilsToWrite = [1, 0, 1];
            await this.runStep(3, async () => {
                await this.modbusService.writeMultipleCoils(5, coilsToWrite);
                return 'Written [1, 0, 1] to Addr 5';
            });

            // 5. Verify Multi Coils
            await this.runStep(4, async () => {
                const bytes = await this.modbusService.readCoils(5, 3);
                if (bytes.length === 0) throw new Error('No data');
                const val = bytes[0] & 0x07;
                if (val !== 5) throw new Error(`Expected 5 (101), got ${val} (bytes: ${bytes})`);
                return 'Verified [1, 0, 1]';
            });

            // 6. Write Multi Registers
            const regsToWrite = [100, 200, 300];
            await this.runStep(5, async () => {
                await this.modbusService.writeMultipleRegisters(20, regsToWrite);
                return 'Written [100, 200, 300] to Addr 20';
            });

            // 7. Verify Multi Registers
            await this.runStep(6, async () => {
                const bytes = await this.modbusService.readHoldingRegisters(20, 3);
                if (bytes.length < 6) throw new Error('Invalid length');

                const r1 = (bytes[0] << 8) | bytes[1];
                const r2 = (bytes[2] << 8) | bytes[3];
                const r3 = (bytes[4] << 8) | bytes[5];

                if (r1 !== 100 || r2 !== 200 || r3 !== 300) {
                    throw new Error(`Mismatch: Got [${r1}, ${r2}, ${r3}]`);
                }
                return 'Verified [100, 200, 300]';
            });

            // 8. Disconnect
            await this.runStep(7, async () => {
                return await this.modbusService.disconnect();
            });

        } catch (e) {
            console.error(e);
        } finally {
            this.isRunning = false;
        }
    }

    resetSteps() {
        this.steps.forEach(s => {
            s.status = 'PENDING';
            s.message = '';
        });
    }

    async runStep(index: number, action: () => Promise<string>) {
        const step = this.steps[index];
        step.status = 'RUNNING';
        try {
            await new Promise(r => setTimeout(r, 500));
            step.message = await action();
            step.status = 'PASS';
        } catch (e: any) {
            step.status = 'FAIL';
            step.message = e.toString();
            throw e;
        }
    }
}
