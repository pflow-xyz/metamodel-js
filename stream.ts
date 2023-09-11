import {Model, Result, Vector} from "./model";

export type Handler<TEvent extends Event> = {
    (s: Stream<TEvent>, evt: TEvent): void;
}

export type Dispatcher<TEvent extends Event> = {
    getHandler: (action: string) => Handler<TEvent>;
    on: (action: string, handler: Handler<TEvent>) => void;
    off: (action: string) => void;
    onFail: (handler: Handler<TEvent>) => void;
    fail: Handler<TEvent>;
}

type StreamArgs<TEvent extends Event> = {
    models: Model[];
}

type Event = {
    schema: string;
    action: string;
    multiple: number;
}

type EventLog<TEvent> = {
    seq: number;
    event: TEvent;
    ts: number; // micro
}


export class Stream<TEvent extends Event> {
    readonly dispatcher: Dispatcher<TEvent>;
    public state: Map<string, Vector> = new Map<string, Vector>();
    public models: Map<string, Model> = new Map<string, Model>();
    public history: Array<EventLog<TEvent>> = [];
    private seq = 0;

    constructor({models}: StreamArgs<TEvent>) {
        this.seq = 0;
        this.history = [];
        models.forEach((model) => {
            this.models.set(model.def.schema, model);
        });
        this.dispatcher = this.newDispatcher();
        this.dispatch = this.dispatch.bind(this);
    }

    dispatch(evt: TEvent): Result {
        const model: Model = this.models.get(evt.schema);
        if (!model) {
            throw new Error(`model not found: ${evt.schema}`);
        }
        const state: Vector = this.state.get(evt.schema) || model.initialVector();

        return model.fire(state, evt.action, evt.multiple,
            ({out, role}) => {
                this.state.set(evt.schema, out);
                this.history.push({seq: this.seq++, event: evt, ts: Date.now()});
                const callback = this.dispatcher.getHandler(evt.action);
                if (callback) {
                    callback(this, {...evt, role});
                }
            },
            ({role}) => {
                this.dispatcher.fail(this, {...evt, role});
            });
    }

    restart() {
        this.seq = 0;
        this.history = [];
        this.models.forEach((model) => {
            this.state.delete(model.def.schema);
        });
    }

    private newDispatcher(): Dispatcher<TEvent> {
        const eventHandlers: Map<string, Handler<TEvent>> = new Map<string, Handler<TEvent>>();
        return {
            getHandler: (action: string) => eventHandlers.get(action),
            on: (action: string, handler: Handler<TEvent>) => eventHandlers.set(action, handler),
            off: (action: string) => eventHandlers.delete(action),
            onFail: (handler: Handler<TEvent>) => eventHandlers.set("__onFail__", handler),
            fail: (s: Stream<TEvent>, evt: TEvent) => eventHandlers.get("__onFail__")(s, evt),
        };
    }

}