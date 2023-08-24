import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SylvesterMessengerService {
  private tablesUpdatedSource = new BehaviorSubject<boolean>(false);
  tablesUpdated = this.tablesUpdatedSource.asObservable();

  constructor() { }

  setTablesUpdated(updated: boolean): void {
    this.tablesUpdatedSource.next(updated);
  }
}
