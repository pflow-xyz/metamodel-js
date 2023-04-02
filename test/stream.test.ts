import {tictactoe} from "../src/examples";
import {Stream} from "../src/stream";
import {newModel} from "../src";

interface MyEvent {
    schema: string;
    action: string;
    multiple: number;
    payload: string;
}


describe("stream", () => {
    it("should be able to play tic-tac-toe", () => {
        const models = [newModel({ schema: "game", declaration: tictactoe })];
        const s = new Stream<MyEvent>({models});
        const {on, onFail} = s.dispatcher;

        // if player is X then computer would bind to all X events
        on("X11", ({history}: Stream<MyEvent>, evt: MyEvent) => {
            console.log(evt, "got it!");
            // REVIEW: should we calculate game state from history?
            history.forEach((h) => {
                console.log(h.event.payload);
            });
        });

        onFail((s: Stream<MyEvent>, evt: MyEvent) => {
            console.log(evt, "failed!");
        });

        s.dispatch({schema: "game", action: "X11", multiple: 1, payload: "payload!!"});
        s.dispatch({schema: "game", action: "X11", multiple: 1, payload: "payload!!2"});
    });
    // TODO: test inhibitor arcs
});

