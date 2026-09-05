export interface JwtPayload {
    userId?: number;
    email?: string;
    sub?: number;
}
export function getUserFromToken(): JwtPayload | null {
    const token = localStorage.getItem('token');
    if(!token) return null;
    try{
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/, '/')));
        return decoded as JwtPayload;
    } catch {
        return null;
    }
}