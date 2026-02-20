export function setupFetchInterceptor() {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
        let [resource, config] = args;
        config = config || {};

        // Ensure config headers is a plain object or Headers instance
        if (!config.headers) {
            config.headers = {};
        }

        const token = localStorage.getItem('token');
        if (token) {
            if (config.headers instanceof Headers) {
                config.headers.set('Authorization', `Bearer ${token}`);
            } else {
                (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
            }
        }

        let response = await originalFetch(resource, config);

        // Intercept 401
        if (response.status === 401) {
            const refreshToken = localStorage.getItem('refreshToken');
            const anyConfig = config as any;

            if (refreshToken && !anyConfig._retry) {
                anyConfig._retry = true;

                try {
                    // Try refreshing
                    const refreshResponse = await originalFetch(`${import.meta.env.VITE_API_URL}/auth/refresh-token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refreshToken })
                    });

                    if (refreshResponse.ok) {
                        const data = await refreshResponse.json();
                        localStorage.setItem('token', data.token);

                        // Attach new token and retry
                        if (anyConfig.headers instanceof Headers) {
                            anyConfig.headers.set('Authorization', `Bearer ${data.token}`);
                        } else {
                            (anyConfig.headers as Record<string, string>)['Authorization'] = `Bearer ${data.token}`;
                        }

                        return await originalFetch(resource, anyConfig);
                    } else {
                        // Refresh failed entirely
                        throw new Error('Refresh failed');
                    }
                } catch (err) {
                    console.error('Fetch Interceptor: Session expired', err);
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                }
            } else {
                // Return 401, no refresh token
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            }
        }

        return response;
    };
}
