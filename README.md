# Warlight 2 Funsies

This is probably supposed to be more thorough and involve our actual AI stuff BUT I'm lazy so here's the tl;dr

## ENGINE

FIRST make the engine. You should be able to run the following commands:

```
cd warlight2-engine
(chmod +x build.sh)
./build.sh
```

If that doesn't work, `cd warlight2-engine` and run:

```
javac -sourcepath src/ -d bin/ -cp lib/java-json.jar `find src/ -name '*.java' -regex '^[./A-Za-z0-9]*$'\`
```

Good job you did it I'm so proud of you.

## PLAYING

You got two options here. I've already imported a bunch of maps into `warlight2-engine/maps` but if you want more run this:

```
cd warlight2-engine
node get_map.js [game_id from theaigames.com]
```

Now you have cool maps. Run this to play a game:

```
cd warlight2-engine
node run_game.js bot1command bot2command [gameid]
```

For example:

```
cd warlight2-engine
node run_game.js "node ../AI/Final/Bot.js" "node ../AI/Final/Bot.js"
```

runs the AI/Final bot against itself on a random map.

## WATCHING AND JUDGING CRITICALLY

Now you want to watch your bot lose? cool! Do this:

```
cd warlight2-engine/replay
http-server
```

If this doesn't work (IT WONT THE FIRST TIME), run `npm install -g http-server` and then try again. If you don't have npm go install Node (https://nodejs.org/en/).

Yay you made a webserver. Go to http://localhost:8080 to see your game in action. You can watch any game you've run on your computer.
