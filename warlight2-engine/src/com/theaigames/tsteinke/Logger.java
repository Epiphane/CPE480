package com.theaigames.tsteinke;

import java.io.IOException;
import java.io.File;
import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.PrintWriter;

import com.theaigames.game.warlight2.move.Move;
import com.theaigames.game.warlight2.map.Map;

/**
 * Whatever man
 *
 * @author Thomas Steinke
 */
public class Logger {

    private PrintWriter writer;
    private FileWriter fileWriter;

    public Logger(String filename) throws IOException {
        // File file = new File(filename);

        // // if file doesnt exists, then create it
        // if (!file.exists()) {
        //     file.createNewFile();
        // }

        // fileWriter = new FileWriter(file.getAbsoluteFile());
        // writer = new BufferedWriter(fileWriter);

        this.writer = new PrintWriter(filename, "UTF-8");

        System.out.println("Opened " + filename + " for writing");
    }

    public void finalize() {
        try {
            this.writer.close();
        }
        catch (Exception e) {
            System.out.println("Oh no what do");
        }
    }

    public void write(String log) {
        try {
            writer.print(log);
        }
        catch (Exception e) {
            System.out.println("Oh no what do");
        }
    }

    public void writeln(String log) {
        try {
            this.writer.println(log);
        }
        catch (Exception e) {
            System.out.println("Oh no what do");
        }
    }
    
}
