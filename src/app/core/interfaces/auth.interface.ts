export interface User {

  id: string;

  email: string;

  fullName: string;

  roles: ('ADMIN' | 'CLIENT')[];

}



export interface AuthResponse {

  access_token: string;

  user: User;

}