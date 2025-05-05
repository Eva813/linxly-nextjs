import 'next-auth';
import "next-auth/jwt"; 
// https://next-auth.js.org/getting-started/typescript
declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    token: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      token?: string;
      accessToken?: string;
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    token?: string;
    accessToken?: string;
  }
}