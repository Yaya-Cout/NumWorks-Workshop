import { Project, Script, User, Group } from "../types";

/*
 * Class to interact with the Workshop API
 *
 * @class API
 */
export default class API extends EventTarget {
    BASE_URL: string;
    NOT_LOGGED_IN_ERROR: boolean = false;
    LOGGED_IN: boolean = false;
    USERNAME: string = "";
    READY: boolean = false;

    /*
     * Initialize the API client
     */
    constructor() {
        super()

        this.BASE_URL = "https://django-cdqivkhudi9mmk5gqgb0.apps.playground.napptive.dev/";

        // Update user info
        this.updateUserInfo()
    }

    /*
     * Login to the API
     * @param {string} username - The username of the user
     * @param {string} password - The password of the user
     * @returns {Promise} - A promise that resolves to the user's username
     */
    async login(username: string, password: string): Promise<string> {
        const response = await fetch(
            this.BASE_URL + "api/auth/login/",
            {
                method: "POST",

                headers: {
                    'Authorization': 'Basic ' + window.btoa(username + ":" + password),
                    "Content-Type": "application/json",
                },
            });
        if (response.status !== 200) {
            throw new Error("Invalid credentials");
        }

        const json = await response.json()

        if (json["token"] === undefined) {
            throw new Error("Token not found")
        }

        this.setToken(json["token"])

        return json["user"]["username"]
    }

    /*
     * Logout of the API
     * @returns {Promise} - A promise that resolves to true if the logout was successful
     */
    async logout(): Promise<boolean> {
        console.log("Logging out")
        // Check if the token is present
        if (!this.isLoggedIn()) {
            console.warn("Tried to log out when not logged in");
            return true;
        }

        // Invalidate the token on the server
        try {
            const request = await this._request("api/auth/logout/", "POST", {}, 204)
        } catch (e) {
            console.error("Failed to invalidate token on server");
        }

        // Remove the token
        this.setToken("")

        this.LOGGED_IN = false;

        return true;
    }

    /*
     * Get the token of the user
     * @returns {string} - The token of the user
     */
    getToken(): string {
        return sessionStorage.getItem("token") || "";
    }

    /*
     * Set the token of the user
     * @param {string} token - The token of the user
     */
    setToken(token: string): void {
        if (token === "") {
            sessionStorage.removeItem("token")
            this.LOGGED_IN = false;
            return;
        } else {
            this.LOGGED_IN = true;
        }
        sessionStorage.setItem("token", token);
    }

    /*
     * Get if the user is logged in
     * @returns {boolean} - True if the user is logged in, false otherwise
     */
    isLoggedIn(): boolean {
        // TODO: Check if the token is valid using the API
        if (this.getToken() === "") {
            this.LOGGED_IN = false;
        } else {
            this.LOGGED_IN = true;
        }
        return this.LOGGED_IN;
    }

    /*
     * Make an authenticated request to the API (if the user is logged in)
     * @param {string} endpoint - The endpoint to make the request to
     * @param {string} method - The HTTP method to use
     * @param {object} body - The body of the request
     * @returns {Promise} - A promise that resolves to the response
     */
    async _request(endpoint: string, method: string, body: object, expectedStatus: number = 200, loginRequired: boolean = true, skipReady: boolean = false): Promise<any> {
        // If the login is required, wait for the API to be ready
        if (!this.READY && !skipReady) {
            // Wait for the event to be emitted
            await new Promise((resolve) => {
                this.addEventListener("ready", () => {
                    resolve()
                })
            })
        }

        if (!this.isLoggedIn() && loginRequired) {
            this.NOT_LOGGED_IN_ERROR = true;
            throw new Error("Not logged in");
        }

        const payload = {
            method: method,
            headers: {
                "Content-Type": "application/json",
            }
        }
        if (this.isLoggedIn()) {
            payload.headers["Authorization"] = "Token " + this.getToken()
        }

        if (method !== "GET" && method !== "HEAD") {
            payload.body = JSON.stringify(body)
        }

        const response = await fetch(this.BASE_URL + endpoint, payload)

        if (response.status !== expectedStatus && expectedStatus !== 0) {
            throw new Error("API request failed");
        }

        try {
            return await response.json()
        }
        catch (e) {
            return undefined
        }
    }

    /*
     * Get projects from the API
     * @param {string} query - The query to search for (optional)
     * @returns {Promise} - A promise that resolves to the projects
     */
    async getProjects(
        query: string = "",
    ): Promise<Project[]> {
        const response = await this._request(
            "scripts/" + (query !== "" ? "?search=" + query : ""),
            "GET", {}, 200, false
        )

        // Convert the response to a list of projects
        const projects: Project[] = []
        for (const project of response.results) {
            // Convert the files
            const files: Script[] = []
            for (const file of project["files"]) {
                files.push({
                    title: file["name"],
                    content: file["content"],
                })
            }

            projects.push({
                title: project["name"],
                rating: 3.5,
                description: project["description"],
                author: project["author"].split("/").slice(-2)[0],
                files: files,
                uuid: project["id"],
                isPublic: project["is_public"],
                language: project["language"],
            })
        }

        return projects
    }

    /*
     * Get a project from the API
     * @param {string} uuid - The UUID of the project
     * @returns {Promise} - A promise that resolves to the project
     * @throws {Error} - If the project does not exist
     */
    async getProject(uuid: string): Promise<Project> {
        const response = await this._request("scripts/" + uuid + "/", "GET", {}, 200, false)

        // Convert the files
        const files: Script[] = []
        for (const file of response["files"]) {
            files.push({
                title: file["name"],
                content: file["content"],
            })
        }

        // Convert the response to a project
        const project: Project = {
            title: response["name"],
            // TODO: Get the rating (requires a new field in the API or a
            // computation on the client)
            rating: 3.5,
            description: response["description"],
            author: response["author"].split("/").slice(-2)[0],
            files: files,
            uuid: response["id"],
            isPublic: response["is_public"],
            language: response["language"],
        }

        return project
    }

    /*
     * Create a project on the API
     * @param {Project} project - The project to create
     * @returns {Promise} - A promise that resolves to the UUID of the project
     */
    async createProject(project: Project): Promise<string> {
        // Convert the files
        const files: object[] = []
        for (const file of project.files) {
            files.push({
                name: file.title,
                content: file.content,
            })
        }

        // Create the project
        const response = await this._request("scripts/", "POST", {
            name: project.title,
            description: project.description,
            files: files,
            is_public: project.isPublic,
            language: project.language,
        }, 201, true)

        return response["id"]
    }

    /*
     * Create an one-file project on the API
     * @param {string} name - The name of the project (same as the file)
     * @param {string} content - The content of the file
     * @returns {Promise} - A promise that resolves to the UUID of the project
     */
    async createOneFileProject(name: string, content: string): Promise<string> {
        // Get the language of the file
        let language;
        if (name.endsWith(".py")) {
            language = "python";
        } else if (name.endsWith(".xw")) {
            language = "xcas";
        } else {
            console.warn("Unknown file extension");
            language = "python";
        }

        // Create the project
        return await this.createProject({
            title: name,
            description: "",
            language: language,
            files: [{
                title: name,
                content: content,
            }],
            isPublic: false,
        })
    }

    /*
     * Update a project on the API
     * @param {Project} project - The project to update
     * @returns {Promise} - A promise that resolves to the response
     * @throws {Error} - If an error occurred
     */
    async updateProject(project: Project): Promise<object> {
        // Convert the files
        const files: object[] = []
        for (const file of project.files) {
            files.push({
                name: file.title,
                content: file.content,
            })
        }

        // Update the project
        const response = await this._request("scripts/" + project.uuid + "/", "PUT", {
            name: project.title,
            description: project.description,
            files: files,
            is_public: project.isPublic,
            language: project.language,
        }, 200, true)

        return response
    }

    /*
     * Register a user on the API
     * @param {string} username - The username of the user
     * @param {string} password - The password of the user
     * @param {string} email - The email of the user
     * @returns {Promise} - A promise that resolves to request status (boolean)
     *                      and response (json)
     * @throws {Error} - If the username is already taken
     */
    async register(username: string, password: string, email: string): Promise<{ success: boolean, response: object }> {
        const response = await this._request("register/", "POST", {
            username: username,
            password: password,
            email: email,
        }, 0, false)

        // Check if the request was successful
        if (response === undefined) {
            throw new Error("API request failed");
        }

        if (!response["username"] || response["username"] !== username) {
            return {
                success: false,
                response: response,
            }
        }
        return {
            success: true,
            response: response,
        }
    }

    /*
     * Update user information on the API
     * @returns {Promise} - A promise that resolves when the request is done
     */
    async updateUserInfo(): Promise<void> {
        if (!this.isLoggedIn()) {
            this.LOGGED_IN = false
            this.USERNAME = ""
        } else {
            try {
                const response = await this._request("current_user/", "GET", {}, 200, false, true)
                this.LOGGED_IN = true
                this.USERNAME = response["username"]
            } catch (e) {
                this.logout()
                // TODO: Better error handling
            }
        }

        console.log("User info updated")

        // Mark the API as initialized
        this.READY = true

        // Notify that the API is ready
        this.dispatchEvent(new CustomEvent("ready"))
    }


    /*
     * Return a lasy-loaded user
     * @param {string} username - The username of the user
     * @returns {User} - The user
     * @throws {Error} - If the user does not exist
     */
    getUser(username: string): User {
        // Create the user object
        const user: User = {
            username: username,
            groups: [],
            projects: [],
            collaborations: [],
            ratings: [],
            _loaded: false,
            _loading: false,
        }

        // Create the proxy
        return new Proxy(user, {
            get: async (target, prop) => {
                // Load the user if needed
                if (!target._loaded && !target._loading) {
                    target._loading = true

                    // Get the user data
                    const user = await this._getUser(target.username)

                    // Update the user
                    target._loaded = true
                    target._loading = false
                    target.groups = user.groups
                    target.projects = user.projects
                    target.collaborations = user.collaborations
                    target.ratings = user.ratings
                } else if (target._loading) {
                    // Wait for the user to load
                    await new Promise((resolve) => {
                        const interval = setInterval(() => {
                            if (target._loaded) {
                                clearInterval(interval)
                                resolve()
                            }
                        }, 100)
                    })
                }

                // Return the property
                return target[prop]
            }
        })
    }


    /*
     * Get an user from the API (internal)
     * @param {string} username - The username of the user
     * @returns {Promise} - A promise that resolves to the user
     * @throws {Error} - If the user does not exist
     */
    async _getUser(username: string): Promise<User> {
        const response = await this._request("users/" + username + "/", "GET", {}, 200, false)

        // Convert the response to a user
        const user: User = {
            username: response["username"],
            groups: response["groups"],
            projects: response["scripts"],
            collaborations: response["collaborations"],
            ratings: response["ratings"],
        }

        // Convert the groups
        const groups: Group[] = []
        for (const group of user.groups) {
            const groupId = parseInt(group.split("/").at(-2))
            groups.push(this.getGroup(groupId))
        }

        user.groups = groups

        return user
    }

    /*
     * Return a lasy-loaded group object
     * @param {number} id - The ID of the group
     * @returns {Proxy} - A proxy that fetches the group data from the API when
     *                    needed
     * @throws {Error} - If the group does not exist
     */
    getGroup(id: number): Group {
        // Create the group object
        const group: Group = {
            id: id,
            url: this.BASE_URL + "groups/" + id + "/",
            name: "",
            user_set: [],
            _loaded: false,
            _loading: false,
        }

        // Create the proxy
        return new Proxy(group, {
            get: async (target, prop) => {

                // Load the group if needed
                if (!target._loaded && !target._loading) {
                    target._loading = true

                    // Get the group data
                    const group = await this._getGroup(target.id)

                    // Update the group
                    target._loaded = true
                    target._loading = false
                    target.name = group.name
                    target.user_set = group.user_set
                } else if (target._loading) {
                    // Wait for the group to load
                    await new Promise((resolve) => {
                        const interval = setInterval(() => {
                            if (target._loaded) {
                                clearInterval(interval)
                                resolve()
                            }
                        }, 100)
                    })
                }

                // Return the property
                return target[prop]
            }
        })
    }

    /*
     * Get a group from the API (internal)
     * @param {number} id - The ID of the group
     * @returns {Promise} - A promise that resolves to the group
     * @throws {Error} - If the group does not exist
     * @private
     */
    async _getGroup(id: number): Promise<Group> {
        const response = await this._request("groups/" + id + "/", "GET", {}, 200, false)

        // Convert the user set
        const userSet: User[] = []
        for (const user of response["user_set"]) {
            const username = user.split("/").at(-2)
            userSet.push(this.getUser(username))
        }

        // Convert the response to a group
        const group: Group = {
            id: response["url"].split("/").at(-2),
            url: response["url"],
            name: response["name"],
            user_set: userSet,
            _loaded: true,
            _loading: false,
        }

        return group
    }

}

