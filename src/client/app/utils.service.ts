import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  // compare(a: number | string | boolean, b: number | string | boolean, isAsc: boolean) {
  //   return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  // }

  compare(a: any, b: any, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  ltrim(str: string): string {
    if(!str) return str;
    return str.replace(/^\s+/g, '');
  }

  checkForDuplicates(arr: string[]): boolean {
    return new Set(arr).size !== arr.length
}
}
