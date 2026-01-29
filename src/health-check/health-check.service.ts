import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class HealthCheckService {
  private readonly packageJson: any;

  constructor() {
    // package.json에서 버전 정보 읽기
    const packagePath = join(process.cwd(), 'package.json');
    this.packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
  }

  getHealthStatus() {
    return {
      serviceName: 'gateway-respond.io',
      version: this.packageJson.version || '0.0.1',
      timestamp: this.getCurrentTimestamp(),
    };
  }

  private getCurrentTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }
}
