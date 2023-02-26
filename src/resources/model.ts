import { defaultsDeep } from 'lodash';

class Model {
    #defaults: any;

    public get defaults(): any {
        return this.#defaults;
    }

    public set defaults(value: any) {
        this.#defaults = value;
    }

    constructor(attributes = {}) {
        defaultsDeep(this, attributes, this.defaults);
    }
}

export default Model;
