import { editor, input, select, confirm } from '@inquirer/prompts';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { FileFormat } from '../types/file-format.type';
import { bold, greenBright, red, green } from 'chalk';
import { printTable } from 'console-table-printer';
import versionConfig from './version.config.json';
import { AppService } from "./app.service";
import { Component } from "modilitejs";
import path from 'node:path';
import { $ } from 'execa';
import wait from 'wait';
import ora from 'ora';

@Component()
export class AppComponent {
  private readonly spinner = ora();

  constructor(private readonly service: AppService) {
    console.clear();
    console.log(this.service.getDisplay());
    this.addStorage();
  }

  protected async addStorage() {
    try {
      this.spinner.start('Looking for changes ...');
      await wait(600);
  
      const git_status = await $`git status -s`;
      const list_files = git_status.stdout.split('\n');
      const files_format: FileFormat[] = [];
      
      if (list_files.length > 0 && list_files[0].length > 0) {
        for (const file of list_files) {
          const [prefix, filename] = file.trim().split(/\s+/);
          files_format.push({
            status: this.service.getPrefix(prefix),
            file: bold(filename),
            size: this.service.getFileSize(prefix, filename)
          });
        }
  
        this.spinner.stop();
        printTable(files_format);
        await $`git add .`;
        await wait(300);
        console.log(greenBright('✔'),`${list_files.length} files added to staged 🚀`);
  
        const typeSelected = await select({
          message: 'Select a type of commit to perform:',
          choices: versionConfig,
          loop: false,
        });
  
        const versionCommit = this.service.getVersion(typeSelected);
  
        const titleCommit = await input({
          message: 'Commit title'
        });
  
        const messageCommit = await editor({
          message: 'Commit description',
          default: 'No description for this commit'
        });
  
        const npmVersion = await $`npm version ${[versionCommit]} --no-git-tag-version`;
  
        this.spinner.start('Generating commit ...');
        await wait(600);
        await $`git add .`;
        await $`git commit -m ${[`${typeSelected}: ${titleCommit} (${npmVersion.stdout})`]} -m ${[`${messageCommit}`]}`;
        this.spinner.succeed('Commit generated.');
        await wait(600);
  
        const git_log = await $`git log --oneline -n ${['1']}`;
        console.log('🚀', bold(git_log.stdout));
        return;
      }
  
      this.spinner.succeed('All your changes are up to date.');
    }
    catch (err) {
      const message = (err as Error).message;

      if (/not a git repository/ig.test(message)) {
        this.spinner.stopAndPersist({
          text: 'Found an issue in your repository',
          symbol: red('✖'),
        });

        this.createGitRepository();
        return;
      }
      else if (/user force closed/ig.test(message)) {
        process.exit(0);
      }

      this.spinner.stopAndPersist({
        text: 'An error ocurred',
      });

      console.error(red('[error]'), bold(message));
      console.dir(err);
    }
  }

  private async createGitRepository() {
    const pkgFile = 'package.json';

    try {
      this.spinner.start('Analyzing repository ...');
      await wait(600);

      this.spinner.fail('No git repository found in your project . 😒');
      await wait(600);

      const isConfirm = await confirm({
        message: 'Do you want to add your project to git?',
        default: true,
      });

      if (isConfirm) {
        await wait(600);

        const branchName = await input({
          message: 'What do you want to name your main branch:',
          default: 'main',
          theme: {
            prefix: green('?'),
          },
        });

        this.spinner.start(bold('Creating git repository ...'));
        await wait(600);

        if (!existsSync(path.resolve(process.cwd(), pkgFile))) {
          await $`npm init --init-version ${['0.0.1']} -y`;
        }
        else {
          await $`npm version ${['0.0.1']} --allow-same-version`;
        }

        const pkg = JSON.parse(
          readFileSync(path.resolve(process.cwd(), pkgFile)).toString()
        );

        this.createGitIgnoreFile();
        await $`git init -b ${[branchName]}`;
        await $`git add .`;
        await $`git commit -m ${[`"chore: first commit (v0.0.1)"`]} -m ${[`"First commit for the project ${pkg['name']}"`]}`

        this.spinner.succeed('Repository created.');

        const { stdout } = await $`git log --oneline -n ${['1']}`;
        console.log('🚀', bold(stdout));
      }
    }
    catch (err) {
      const message = (err as Error).message;

      if (/user force closed/ig.test(message)) {
        process.exit(0);
      }

      this.spinner.stopAndPersist({
        text: 'Found an issue in your repository',
        symbol: red('✖'),
      });

      console.log(red('[error]'), bold(message));
      console.dir(err);
    }
  }

  private createGitIgnoreFile() {
    const file = '.gitignore';

    if (!existsSync(path.resolve(process.cwd(), file))) {
      writeFileSync(path.resolve(process.cwd(), file), `
        # Backup files created by text editors
        *~

        # Temporary files
        *.tmp

        # Directories generated by operating systems or IDEs
        .DS_Store
        Thumbs.db
        .vscode/
        .idea/

        # Dependencies and modules generated by development tools
        node_modules/
        bower_components/
        vendor/

        # Log files
        *.log
        package-lock.json

        # Build files and test results
        /build/
        /dist/
        /out/
        /coverage/
        /log/
      `.replace(/^\s+/gm, ''));
    }
  }
}
