import { Errorable } from "./errorable";

export class ConcreteSafeType<T> {
    private v : T | null;
    constructor(v: T, isValueValid: (v: T) => boolean) {
        if (isValueValid(v)) {
                
            this.v = v
        }else {
            this.v = null
        }
}
    build(): Errorable<ConcreteSafeType<T>>  {
        if (this.v === null) {
            return new Errorable<ConcreteSafeType<T>>("Value is not valid", null) 
        }
        return new Errorable<ConcreteSafeType<T>>(null, this)
    }



    public  getV(): T {
        return this.v!;   
    }

    public  setV(v: T) {
        this.v = v;
    }
}