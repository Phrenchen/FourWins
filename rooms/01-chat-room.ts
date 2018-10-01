import { Room } from "colyseus";

export class ChatRoom extends Room {

    // replace with DB
    private matches: Match[] = [];

    private columnCount:number = 7;
    private rowCount:number = 6;
    private playerColor1:string = "white";
    private playerColor2:string = "black";
    
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
            matchState: state,
            playerColor1: this.playerColor1,
            playerColor2: this.playerColor2
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
    
    private playColumn(match:Match, selectedColumn:number):boolean{
        // is there an empty cell in the selected column?
        let grid:Array<Array<string>> = match.matchState;
        let mostBottomEmptyRowInColumn = -1;
        let cellId:number = -1;

        // check each row at position selectedColumn if empty ("-")
        for(let r=0; r<grid.length; r++){
            if(grid[r][selectedColumn] === "-"){
                cellId = r * this.columnCount + selectedColumn;
                console.log("found empty cell: " + cellId + " in row: " + r);        
                mostBottomEmptyRowInColumn = r;
            }
        }

        if(cellId >= 0){
            // valid move
            // update match
            let firstPlayerActive:boolean = match.activePlayer === match.players[0];
            grid[mostBottomEmptyRowInColumn][selectedColumn] = firstPlayerActive ? "0" : "1";

            // next player
            match.activePlayer = firstPlayerActive ? match.players[1] : match.players[0];
            
            this.logMatch(match);
            return true;
        }
        return false;
    }
    

    //-----------------------
    onInit (options) {
        console.log("BasicRoom created!", options);
        
        // create new match
        this.matches.push( this.createMatch(options.clientId) );
    }
    
    onJoin (client) {
        this.broadcast(`${ client.sessionId } joined.`);
        // console.log("find match for " + client.id + " and add player: " + client.sessionId);

        let match:Match = this.getMatch(client.id);
        match.players.push(client.sessionId);
        
        if(match.players.length > 1){
            match.activePlayer = Math.random() <.5 ? match.players[0] : match.players[1];   // select random first player
        }
        else{
            match.activePlayer = match.players[0];  // single player
        }
        // broadcast match
        this.broadcast(match);
    }

    onLeave (client) {
        this.broadcast(`${ client.sessionId } left.`);
    }

    onMessage (client, data) {
        console.log("match: " + client.id + " received message from", client.sessionId, ":", data);
        // console.log("2 BasicRoom received message from", client.sessionId, ":", data.message);
        // console.log("3 BasicRoom received message from", client.sessionId, ":", data.test);
        // console.log("---");

        // is the message a selected cell by the correct player?
        let match: Match = this.getMatch(client.id);

        if(match){
            if(client.sessionId === match.activePlayer){
                console.log(match.activePlayer + " selected row " + data.selectedColumn);
                
                let isValidMove = this.playColumn(match, data.selectedColumn);
                
                if(isValidMove){
                    console.log("valid move -> update match");
                    const msg = {
                        sessionID: client.sessionId,
                        match: match
                    };
                    this.broadcast(msg);
                }
                else{
                    console.log("invalid column. out of range or full? send hint only to the active player");
                }
            }
            else{
                console.log("wait for your turn, player " + client.sessionId + " !");
            }
        }
    }

    onDispose () {
        console.log("Dispose BasicRoom");
        // remove match without any players
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
}

interface Match{
    id: string;
    players: Array<string>;
    activePlayer:string;
    matchState: Array<Array<string>>;
    playerColor1: string;
    playerColor2: string;
}

