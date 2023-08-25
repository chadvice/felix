import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SylvesterMessengerService {
  private tablesUpdatedSource = new BehaviorSubject<boolean>(false);
  tablesUpdated = this.tablesUpdatedSource.asObservable();

  private tableDeletedSource = new BehaviorSubject<boolean>(false);
  tableDeleted = this.tableDeletedSource.asObservable();

  constructor() { }

  setTablesUpdated(updated: boolean): void {
    this.tablesUpdatedSource.next(updated);
  }

  setTableDeleted(updated: boolean): void {
    this.tableDeletedSource.next(updated);
  }
}
