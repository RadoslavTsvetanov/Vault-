import type { Errorable } from "./utils/types/errorable"

export const handleErrorable = async < T = any, NormalHandlerReturn = null, ErrorHandlerReturnType = null> (errorable: Errorable<T>, normalHandler: (v : T) => Promise<NormalHandlerReturn>, errorHandler?: (e: string) => Promise<ErrorHandlerReturnType>): Promise<[NormalHandlerReturn | null,ErrorHandlerReturnType | null]> => {
    if (!errorable.hasErrored()) {

        if (errorable.value === null) {
            console.error("errorable does not have error not does it have a value")
            return [null,null]
        }



        return [await normalHandler(errorable.value),null]

        
    }

    if (errorHandler) {
        return  [null,await errorHandler(errorable.err)]
        
    }

    console.log(errorable.err)
    throw new Error()
}


export const handleErrorableWithDefaults = async<T>(errorable: Errorable<T>): Promise<T> => {
    const [value, error] = await handleErrorable<T, T>(
        errorable,
        async (v) => { return v }
    )

    return value
    
}