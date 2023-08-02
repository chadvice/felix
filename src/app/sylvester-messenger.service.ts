import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface TableInfo {
  name: string,
  description: string
}

@Injectable({
  providedIn: 'root'
})
export class SylvesterMessengerService {;
  private detailTableNameSource = new BehaviorSubject<TableInfo|null>(null);
  detailTableName = this.detailTableNameSource.asObservable();

  constructor() { }

  setDetailTableName(tableInfo: TableInfo | null) {
    this.detailTableNameSource.next(tableInfo);
  }

}
