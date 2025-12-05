import axios, { type AxiosInstance } from 'axios';

axios.defaults.baseURL = `${process.env.NEXT_PUBLIC_ROOT_API_URL}`;

// POST Next api/cookies
export const cookiesPoster = async (url: string, body: object) => {
	axios.defaults.baseURL = `${process.env.NEXT_PUBLIC_BACKEND_API}`;
	const response = await axios.post(
		url,
		{
			...body,
			maxAge: 86400,
		},
		{
			headers: {
				'Content-Type': 'application/json',
			},
		},
	);
	return {
		status: response.status,
	};
};

// DELETE Next api/cookies
export const cookiesDeleter = async (url: string, body: object) => {
	axios.defaults.baseURL = `${process.env.NEXT_PUBLIC_BACKEND_API}`;
	const response = await axios.delete(url, {
		data: body,
	});
	return {
		status: response.status,
	};
};

/*** Base Axios Json Api call [POST] */
export const postApi = async (url: string | undefined, instance: AxiosInstance, body?: object) => {
	const response = await instance.post(`${url}`, body);
	return {
		status: response.status,
		data: response.data,
	};
};
