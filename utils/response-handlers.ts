import express from "express";


export type ErrorResponse = {
    error: string,
    statusCode: number
}
export function handleError(res: express.Response, errorResponse: ErrorResponse) {
   res.status(errorResponse.statusCode).json(errorResponse.error)
}



export const handleUnauthenticatedError = (res: express.Response) => {
    const errorResponse: ErrorResponse = {
        error: "Unauthenticated",
        statusCode: 401
    }
    handleError(res, errorResponse)
}



export const sendSuccessfulResponse = <T>(res: express.Response<T>, responseBody?: T ) => {
    res.status(200).json(responseBody)
} 