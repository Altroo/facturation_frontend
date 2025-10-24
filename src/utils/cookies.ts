import {serialize, SerializeOptions} from 'cookie';
import {NextResponse} from "next/server";

// Runs on next server
export const setCookie = (name: string, value: unknown, options: SerializeOptions = {}) => {
  const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (typeof options.maxAge === 'number') {
    options.expires = new Date(Date.now() + options.maxAge * 1000);
  }
  return NextResponse.next({
    status: 200,
    headers: {
      'Set-Cookie': serialize(name, stringValue, options),
    },
  });
};

export const deleteCookie = (name: string, options: SerializeOptions = {}) => {
  options.maxAge = -1;
  options.expires = new Date(Date.now() - 1000);
  return NextResponse.next({
    status: 200,
    headers: {
      'Set-Cookie': serialize(name, '', options),
    },
  });
};
