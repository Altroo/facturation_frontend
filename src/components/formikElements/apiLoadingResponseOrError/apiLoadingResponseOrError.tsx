import React from "react";
import ApiProgress from "./apiProgress/apiProgress";
import ApiAlert from "./apiAlert/apiAlert";
import { ApiErrorType, ApiPromiseStatus } from "@/types/_init/_initTypes";

type Props = {
	promiseStatus: ApiPromiseStatus;
	inProgress: boolean;
	error: ApiErrorType;
	children?: React.ReactNode;
}

const ApiLoadingResponseOrError: React.FC<Props> = (props: Props) => {

	return (
		<>
			{props.inProgress && props.promiseStatus === 'PENDING' && (
					<ApiProgress cssStyle={{ position: 'absolute', top: '50%', left: '50%' }}  backdropColor="#FFFFFF" circularColor="#FFFFFF"/>
				)}
				{!props.inProgress && props.promiseStatus === 'REJECTED' && props.error && (
					<ApiAlert
						errorDetails={props.error.details}
						cssStyle={{ position: 'absolute', left: '50%', top: '50%', margin: '0 -60px -60px -60px' }}
					/>
				)}
		</>
	);
};

export default ApiLoadingResponseOrError;
