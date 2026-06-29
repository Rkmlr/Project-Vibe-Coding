export const createMockRequest = ({ 
  url = 'http://localhost/api', 
  method = 'GET', 
  body = null, 
  headers = {} 
}) => {
  const reqHeaders = new Headers();
  Object.entries(headers).forEach(([key, value]) => {
    reqHeaders.set(key, value);
  });

  const init = {
    method,
    headers: reqHeaders,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  return new Request(url, init);
};
