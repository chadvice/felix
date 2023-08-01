import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SylvesterMessengerService {;
  private detailTableNameSource = new BehaviorSubject<string>('');
  detailTableName = this.detailTableNameSource.asObservable();

  constructor() { }

  setDetailTableName(tableName: string) {
    this.detailTableNameSource.next(tableName);
  }
}
