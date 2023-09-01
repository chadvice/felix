import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of, shareReplay } from 'rxjs';

import { environment } from '../environments/environment';
import { AuthService } from './auth/auth.service';
import { SylvesterCollection, SylvesterCollectionsDocument, SylvesterDocumentField } from './nelnet/sylvester-collection';
import { CollectionChanges } from './table-structure-editor-dialog/table-structure-editor-dialog.component';
import { SylvesterUser } from './nelnet/sylvester-user';
import { SylvesterRole, SylvesterTablePermission } from './nelnet/sylvester-role';
import { ObjectId } from 'mongodb';

interface APIResponse {
  status: string,
  message?: string
}

@Injectable({
  providedIn: 'root'
})
export class SylvesterApiService {
  private CACHE_DEPTH: number = 1;
  private tablesCache: Observable<SylvesterCollectionsDocument[]> | null = null;
  private tablePermissionsCache: Observable<SylvesterTablePermission[]> | null = null;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) { }

  getTables(): Observable<SylvesterCollectionsDocument[]> {
    if (!this.tablesCache) {
      this.tablesCache = this.requestTables().pipe(
        shareReplay(this.CACHE_DEPTH)
      )
    }

    return this. tablesCache;
  }

  private requestTables(): Observable<SylvesterCollectionsDocument[]> {
    const url: string = `${environment.sylvesterApiUrl}/tables`

    return this.http.get<SylvesterCollectionsDocument[]>(url, this.getHttpOptions()).pipe(
      catchError(this.handleError<SylvesterCollectionsDocument[]>('getTables')),
    )
  }

  clearTablesCache(): void {
    this.tablesCache = null;
  }

  getTablesForUser(userID: string): Observable<SylvesterCollectionsDocument[]> {
    const url: string = `${environment.sylvesterApiUrl}/tables/${userID}`

    return this.http.get<SylvesterCollectionsDocument[]>(url, this.getHttpOptions()).pipe(
      catchError(this.handleError<SylvesterCollectionsDocument[]>('getTablesForUser')),
    )
  }

  getTableNames(): Observable<string[]> {
    const url: string = `${environment.sylvesterApiUrl}/tablenames`

    return this.http.get<string[]>(url, this.getHttpOptions()).pipe(
      catchError(this.handleError<string[]>('getTableNames')),
    )
  }

  getTable(tableName: string): Observable<SylvesterCollection> {
    const url: string = `${environment.sylvesterApiUrl}/table/${tableName}`

    return this.http.get<SylvesterCollection>(url, this.getHttpOptions()).pipe(
      catchError(this.handleError<SylvesterCollection>('getTable')),
    )
  }

  alterCollection(collectionName: string, changes: CollectionChanges): Observable<APIResponse> {
    const url: string = `${environment.sylvesterApiUrl}/collection`

    const userID = this.getUserID();
    const body = {
      userID: userID,
      collectionName: collectionName,
      newDescription: changes.newDescription,
      fieldChanges: changes.fieldChanges
    }

    return this.http.put<APIResponse>(url, body, this.getHttpOptions()).pipe(
      catchError(this.handleError<APIResponse>('alterCollection')),
    )
  }

  updateDocument(collection: string, document: Object): Observable<APIResponse> {
    const url: string = `${environment.sylvesterApiUrl}/document`

    const userID = this.getUserID();

    const body = {
      userID: userID,
      collection: collection,
      document: document
    }

    return this.http.put<APIResponse>(url, body, this.getHttpOptions()).pipe(
      catchError(this.handleError<APIResponse>('updateDocument')),
    )
  }

  insertDocument(collection: string, document: Object): Observable<APIResponse> {
    const url: string = `${environment.sylvesterApiUrl}/document`

    const body = {
      collection: collection,
      document: document
    }

    return this.http.post<APIResponse>(url, body, this.getHttpOptions()).pipe(
      catchError(this.handleError<APIResponse>('insertDocument')),
    )
  }

  deleteDocument(collection: string, id: string): Observable<APIResponse> {
    const url: string = `${environment.sylvesterApiUrl}/document/${collection}/${id}`

    return this.http.delete<APIResponse>(url, this.getHttpOptions()).pipe(
      catchError(this.handleError<APIResponse>('deleteDocument')),
    )
  }

  bulkInsert(collectionName: string, documents: Object[]): Observable<APIResponse> {
    const url: string = `${environment.sylvesterApiUrl}/bulkinsert`

    const body = {
      collectionName: collectionName,
      documents: documents
    }

    return this.http.post<APIResponse>(url, body, this.getHttpOptions()).pipe(
      catchError(this.handleError<APIResponse>('bulkInsert')),
    )
  }

  bulkReplace(collectionName: string, documents: Object[]): Observable<APIResponse> {
    const url: string = `${environment.sylvesterApiUrl}/bulkreplace`

    const body = {
      collectionName: collectionName,
      documents: documents
    }

    return this.http.post<APIResponse>(url, body, this.getHttpOptions()).pipe(
      catchError(this.handleError<APIResponse>('bulkReplace')),
    )
  }

  bulkCreate(collectionName: string, description: string, fields: SylvesterDocumentField[], documents: Object[]): Observable<APIResponse> {
    const url: string = `${environment.sylvesterApiUrl}/bulkcreate`

    const body = {
      collectionName: collectionName,
      description: description,
      fields: fields,
      documents: documents
    }

    return this.http.post<APIResponse>(url, body, this.getHttpOptions()).pipe(
      catchError(this.handleError<APIResponse>('bulkCreate')),
    )
  }

  deleteCollection(collection: string): Observable<APIResponse> {
    const url: string = `${environment.sylvesterApiUrl}/collection/${collection}`

    return this.http.delete<APIResponse>(url, this.getHttpOptions()).pipe(
      catchError(this.handleError<APIResponse>('deleteCollection')),
    )
  }

  /* #region Users */
  getUsers(): Observable<SylvesterUser[]> {
    const url: string = `${environment.sylvesterApiUrl}/users`;

    return this.http.get<SylvesterUser[]>(url, this.getHttpOptions()).pipe(
      catchError(this.handleError<SylvesterUser[]>('getUsers')),
    )
  }

  getUser(userID: string): Observable<SylvesterUser> {
    const url: string = `${environment.sylvesterApiUrl}/user/${userID}`;

    return this.http.get<SylvesterUser>(url, this.getHttpOptions()).pipe(
      catchError(this.handleError<SylvesterUser>('getUser')),
    )
  }

  updateUser(user: SylvesterUser): Observable<APIResponse> {
    const url: string = `${environment.sylvesterApiUrl}/user`;

    return this.http.put<APIResponse>(url, user, this.getHttpOptions()).pipe(
      catchError(this.handleError<APIResponse>('updateUser')),
    )
  }

  deleteUser(userID: string): Observable<APIResponse> {
    const url: string = `${environment.sylvesterApiUrl}/user/${userID}`;

    return this.http.delete<APIResponse>(url, this.getHttpOptions()).pipe(
      catchError(this.handleError<APIResponse>('deleteUser')),
    )
  }
  /* #endregion */

  /* #region Roles */
  getRoles(): Observable<SylvesterRole[]> {
    const url: string = `${environment.sylvesterApiUrl}/roles`;

    return this.http.get<SylvesterRole[]>(url, this.getHttpOptions()).pipe(
      catchError(this.handleError<SylvesterRole[]>('getRoles')),
    )
  }

  getRolesForUser(userID: string): Observable<SylvesterRole[]> {
    const url: string = `${environment.sylvesterApiUrl}/roles/${userID}`;

    return this.http.get<SylvesterRole[]>(url, this.getHttpOptions()).pipe(
      catchError(this.handleError<SylvesterRole[]>('getRolesForUser')),
    )
  }

  getRole(roleID: string): Observable<SylvesterRole> {
    const url: string = `${environment.sylvesterApiUrl}/role/${roleID}`;

    return this.http.get<SylvesterRole>(url, this.getHttpOptions()).pipe(
      catchError(this.handleError<SylvesterRole>('getRole')),
    )
  }

  updateRole(role: SylvesterRole): Observable<APIResponse> {
    const url: string = `${environment.sylvesterApiUrl}/role`;

    return this.http.put<APIResponse>(url, role, this.getHttpOptions()).pipe(
      catchError(this.handleError<APIResponse>('updateRole')),
    )
  }

  deleteRole(roleID: ObjectId): Observable<APIResponse> {
    const url: string = `${environment.sylvesterApiUrl}/role/${roleID}`;

    return this.http.delete<APIResponse>(url, this.getHttpOptions()).pipe(
      catchError(this.handleError<APIResponse>('deleteRole')),
    )
  }
  /* #endregion */

  getTablePermissionsForUser(userID: string): Observable<SylvesterTablePermission[]> {
    if (!this.tablePermissionsCache) {
      this.tablePermissionsCache = this.requestTablePermissionsForUser(userID).pipe(
        shareReplay(this.CACHE_DEPTH)
      )
    }

    return this.tablePermissionsCache;
  }

  private requestTablePermissionsForUser(userID: string): Observable<SylvesterTablePermission[]> {
    return new Observable(obs => {
      this.getRolesForUser(userID).subscribe(roles => {
        let userPermissions: SylvesterTablePermission[] = [];

        for (let roleIndex = 0; roleIndex < roles.length; roleIndex++) {
          const tablePermissions = roles[roleIndex].tablePermissions;
          if (tablePermissions) {
            for (let permIndex = 0; permIndex < tablePermissions.length; permIndex++) {
              const idx = userPermissions.findIndex(up => up.tableID === tablePermissions[permIndex].tableID);
              if (idx === -1) {
                userPermissions.push(tablePermissions[permIndex]);
              } else {
                // Keep most restrictive permmission if the table exists in more than one role
                if (tablePermissions[permIndex].canEdit === false) {
                  userPermissions[idx].canEdit = false;
                }
              }
            }
          }
        }

        obs.next(userPermissions);
        obs.complete();
      })
    })
  }

  getTablePermissionsForTableID(userID: string, tableID: ObjectId): Observable<boolean> {
    return new Observable(obs => {
      this.getTablePermissionsForUser(userID).subscribe(tablePermissions => {
        let permission: boolean = false;
        const tablePermission = tablePermissions.find(perm => perm.tableID === tableID);

        if (tablePermission) {
          permission = tablePermission.canEdit;
        }

        obs.next(permission);
        obs.complete();
      })
    })
  }

  getTablePermissionsForTableName(userID: string, tableName: string): Observable<boolean> {
    return new Observable(obs => {
      this.getTables().subscribe(tables => {
        const table = tables.find(table => table.name === tableName);
        if (table) {
          this.getTablePermissionsForTableID(userID, table._id).subscribe(permissions => {
            obs.next(permissions);
            obs.complete();
          })
        } else {
          obs.next(false);
          obs.complete();
        }
      })
    })
  }

  private getUserID(): string {
    let userID = this.auth.getUserID();
    if (!userID) {
      userID = 'UNKOWN';
    }

    return userID;
  }

  getHttpOptions() {
    const httpOptions = {
      headers: new HttpHeaders(
        {
          Authorization: 'Bearer ' + this.auth.getToken()
        }
      )
    }

    return httpOptions;
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      console.log(`${operation} failed: ${error.message}`);

      if (error.status === 401) {
        // alert('apiservice::handleError(): error.status = 401, calling auth.init()')
        this.auth.init();
      }

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
