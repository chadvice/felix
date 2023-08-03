import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

import { table } from './nelnet/nelnet-table';

@Injectable({
  providedIn: 'root'
})
export class SylvesterApiService {
  baseUrl: string = 'https://t7c9qq4yyi.execute-api.us-east-1.amazonaws.com/development';

  private httpOptions = {
    headers: new HttpHeaders(
      {
        'Content-Type': 'application/json; charset=UTF-8',
        'x-api-key': 'fpQwusK0HH6Ltlox2yf3r738VuG0ri1qaopWAzMa'
      }
    )
  };

  constructor(
    private http: HttpClient
  ) { }

  getTables():Observable<table> {
    const url: string = `${this.baseUrl}/table`

    return this.http.get<table>(url, this.httpOptions).pipe(
      catchError(this.handleError<table>('getTables')),
    )
  }

  getTable(tableName: string):Observable<table> {
    const url: string = `${this.baseUrl}/table/${tableName}`

    return this.http.get<table>(url, this.httpOptions).pipe(
      catchError(this.handleError<table>('getTable')),
    )
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      console.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
