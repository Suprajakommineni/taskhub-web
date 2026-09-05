import { API_URL } from './config';

//register_api
export async function registerUser(username: string, email: string, password: string) {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({username, email, password})
    })
    if(!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    return response.json();
}

//login_api
export async function loginUser(email: string, password: string) {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({email, password})
    })
    if(!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    return response.json();
}



