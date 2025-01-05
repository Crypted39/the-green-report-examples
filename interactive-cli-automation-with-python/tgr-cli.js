#!/usr/bin/env node

// Import required libraries
import inquirer from "inquirer";
import { Command } from "commander";

// Initialize Commander
const program = new Command();

// Define the tgr -install command
program
  .command("install")
  .description("Install the tool with optional dependencies")
  .action(async () => {
    try {
      // Step 1: Ask if the user wants to install other dependencies
      const { installDeps } = await inquirer.prompt([
        {
          type: "confirm",
          name: "installDeps",
          message: "Do you want to install other dependencies?",
          default: false,
        },
      ]);

      // Step 2: If the user wants to install dependencies, ask for the language
      let language;
      if (installDeps) {
        const { chosenLanguage } = await inquirer.prompt([
          {
            type: "list",
            name: "chosenLanguage",
            message: "Which language do you want to use?",
            choices: ["JavaScript", "TypeScript"],
          },
        ]);
        language = chosenLanguage;
      }

      // Step 3: Prompt the user to enter a username
      const { username } = await inquirer.prompt([
        {
          type: "input",
          name: "username",
          message: "Enter your username:",
        },
      ]);

      // Display a success message
      console.log(`Installation completed successfully!`);

      // Log the user's choices for debugging (optional)
      console.log(`Username: ${username}`);
      if (installDeps) {
        console.log(`Language: ${language}`);
      }
    } catch (error) {
      console.error("An error occurred during installation:", error.message);
    }
  });

// Parse command-line arguments
program.parse(process.argv);
