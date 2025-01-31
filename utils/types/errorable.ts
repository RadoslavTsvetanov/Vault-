// export type Errorable<T> = {
//    / error: string | null,
    // v : T | null
// }


export class Errorable<T> {

    private v: T | null;
    private error: string | null;

    constructor(error: string | null, v: T | null) {
        if (error === null && v === null) {
            throw new Error("one of the values  must be different from null")
        }

        this.v = v;
        this.error = error;
    }

    get value(): T | null {
        return this.v;
    }

    get err(): string | null {
        return this.error;
    }

    hasErrored(): boolean {
        return this.err !== null;
    }
}