import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserDto {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

const API_BASE = 'http://localhost:8000/api/users';

@Injectable({
  providedIn: 'root',
})
export class User {
  private http = inject(HttpClient);

  getUsers(excludeProjectId?: number): Observable<UserDto[]> {
    let url = API_BASE;
    if (excludeProjectId !== undefined) {
      url += `?excludeProjectId=${excludeProjectId}`;
    }
    return this.http.get<UserDto[]>(url);
  }
}