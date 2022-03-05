const baseApiUrl = `http://${import.meta.env.VITE_API_HOST}:${
  import.meta.env.VITE_API_PORT
}`;

interface APIError {
  messages: string[];
  statusCode?: number;
}

interface MakeRequestResponse<T> {
  data: T | Record<string, never>;
  error?: APIError;
}

const makeRequest = async <T>(
  endpoint: string,
  reqInit?: RequestInit
): Promise<MakeRequestResponse<T>> => {
  try {
    const response = await fetch(`${baseApiUrl}${endpoint}`, {
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      ...reqInit,
    });

    const responseJSON = await response.json();

    if (!response.ok) {
      return {
        data: {},
        error: responseJSON as APIError,
      };
    }

    return {
      data: responseJSON as T,
    };
  } catch (e) {
    const error =
      e instanceof Error
        ? {
            messages: [
              import.meta.env.MODE === 'development'
                ? e.message
                : 'Unknown error',
            ],
          }
        : {
            messages: ['Unknown error'],
          };

    return {
      data: {},
      error,
    };
  }
};

export { makeRequest };
