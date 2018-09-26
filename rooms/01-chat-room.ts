import { Room } from "colyseus";

export class ChatRoom extends Room {

    // replace with DB
    private matches: Match[] = [];

    private columnCount:number = 7;
    private rowCount:number = 6;
    
    // 2 player per match of "4 Wins"
    // this room supports only 2 clients connected
    maxClients = 2;
    
    //-----------------------
    private createMatch(matchId:string):Match{
        let state:Array<Array<string>> = new Array<Array<string>>();
        let column:Array<string> = new Array<string>();
        let players:Array<string> = new Array<string>();
        /*
            each cell is initially empty with the 'owner' being "-"
            each player move fills a cell with the owner´s id        
        */

        for(let c = 0; c < this.columnCount; c++){
            column.push("-");
        }

        // duplicate the empty row 
        for(let r = 0; r < this.rowCount; r++){
            state.push( Object.assign([], column) );
        }

        return {
            id: matchId,
            players: players,
            activePlayer: "",
            matchState: state
        };
    }

    private getMatch(clientId:string):Match{
        for(let i = 0; i < this.matches.length; i++){
            if(this.matches[i].id === clientId){
                return this.matches[i];
            }
        }
        return null;        // could this ever happen? if a match is gameOver and has been disposed?
    }
    
    // helper log match
    private logMatch(match:Match):void{
        console.log("*** LOGGING MATCH ***");
        console.log("match: " + match.id);
        console.log("players: " + match.players);
        console.log("activeplayer: " + match.activePlayer);
        console.log("columns: " + match.matchState[0].length);
        console.log("rows: " + match.matchState.length);
        
        let rowString:string = "";

        // state
        console.log("state:");
        for(let c = 0; c < this.columnCount; c++){
            for(let r = 0; r < this.rowCount; r++){
                // console.log(match.matchState[r][c]);
                rowString += match.matchState[r][c] + ", ";
            }
            console.log("column: " + c + ": " + rowString);
            rowString = "";
        }
        console.log("******");
    }

    //-----------------------
    onInit (options) {
        console.log("BasicRoom created!", options);
        
        // create new match here
        this.matches.push( this.createMatch(options.clientId, options.sessionId) );
    }
    
    onJoin (client) {
        this.broadcast(`${ client.sessionId } joined.`);
        console.log("find match for " + client.id + " and add player: " + client.sessionId);
        let match:Match = this.getMatch(client.id);
        match.players.push(client.sessionId);
        match.activePlayer = Math.random() <.5 ? match.players[0] : match.players[1];   // select random first player
        
        // this.logMatch(match);
        
        // broadcast match
        this.broadcast(match);
    }

    onLeave (client) {
        this.broadcast(`${ client.sessionId } left.`);
    }

    onMessage (client, data) {
        console.log("1 BasicRoom received message from", client.sessionId, ":", data);
        console.log("2 BasicRoom received message from", client.sessionId, ":", data.message);
        console.log("3 BasicRoom received message from", client.sessionId, ":", data.test);
        console.log("---");

        // is the message a selected cell by the correct player?

        const msg = {
            sessionID: client.sessionId,
            message: data.message,
            test: data.test,
            greetings: "hi Endel"
        };
        this.broadcast(msg);
    }

    onDispose () {
        console.log("Dispose BasicRoom");
    }

}

interface Match{
    id: string;
    players: Array<string>;
    activePlayer:string;
    matchState: Array<Array<string>>;
}