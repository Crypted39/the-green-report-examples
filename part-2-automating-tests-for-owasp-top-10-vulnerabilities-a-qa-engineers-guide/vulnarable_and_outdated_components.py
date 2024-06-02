import subprocess


def check_npm_audit(project_dir):
    command = ["npm", "audit"]
    process = subprocess.Popen(command, cwd=project_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    output, error = process.communicate()
    output = output.decode()
    error = error.decode()

    if "found 0 vulnerabilities" in output:
        print(f"No vulnerabilities found in {project_dir}")
        return False
    else:
        print(f"Vulnerabilities found in {project_dir}:\n {error}")
        return True


project_dir = "/path/to/your/node/project"
has_vulnerabilities = check_npm_audit(project_dir)

if has_vulnerabilities:
    print("It is recommended to address the identified vulnerabilities.")
else:
    print("Your project appears to be free of vulnerabilities based on npm audit.")
