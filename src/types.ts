// TODO: Promise everywhere and fix the types in the other files

// A workshop project is a project that is created by a user and that can be
// shared with other users. It is composed of a list of scripts and a title.
export type Project = {
    // The name of the project
    title: string,
    // The rating of the project
    // TODO: This is not implemented and is going to be reimplemented using
    // likes
    rating: number,
    // The short description of the project
    short_description: string,
    // The long description of the project
    long_description: string,
    // The author of the project
    // TODO: Precise the type of this field
    author: string,
    // The list of files in the project as Script objects
    files: Script[],
    // The UUID of the project
    uuid: string,
    // Whether the project is public or not
    isPublic: boolean,
    // The language of the project (python, xcas, etc.)
    language: string,
    // The list of tags of the project
    tags: Tag[],
    // The list of tags of the project as a raw string list
    tags_raw: string[],
    // The date of creation of the project
    created: Date,
    // The date of last modification of the project
    modified: Date,
    // The number of views of the project
    views: number,
    // The version of the project
    version: string,
    // The collaborators of the project
    collaborators: string[],
    // The simulator to use for the project
    runner: string,

    // Internal field to know if the project is loaded or not
    _loaded: boolean,
    // Internal field to know if the project is loading or not
    _loading: boolean,
}

// A script is a file in a project. It is composed of a title and a content.
export type Script = {

    title: string,
    content: string,
}

// A group is a group of users. It is composed of a list of users and a name.
export type Group = {
    // The url of the group
    url: string,
    // The id of the group (extracted from the url)
    id: number,
    // The name of the group
    name: string,
    // List of users in the group
    user_set: User[],

    // Internal field to know if the group is loaded or not
    _loaded: boolean,
    // Internal field to know if the group is loading or not
    _loading: boolean,
}

// An user is a user of the website. It is composed of a username, a list of
// groups and a list of projects.
export type User = {
    // The username of the user
    username: string,
    // The list of groups the user is in
    groups: Group[],
    // The list of projects the user has created
    projects: Project[],
    // The list of projects the user has contributed to
    collaborations: Project[],
    // The list of ratings the user has given
    // TODO: This is not implemented and is going to be reimplemented using
    // likes
    ratings: []

    // Internal field to know if the user is loaded or not
    _loaded: boolean,
    // Internal field to know if the user is loading or not
    _loading: boolean,
}

// A tag is a tag that can be added to a project. It is composed of a name, a
// list of projects and a description.
export type Tag = {
    // The name of the tag
    name: string,
    // The list of projects that have this tag
    projects: Project[],
    // The description of the tag
    description: string,

    // Internal field to know if the tag is loaded or not
    _loaded: boolean,
    // Internal field to know if the tag is loading or not
    _loading: boolean,
}

////// Types for the calculator //////

// A record is a file in the calculator. It is composed of a name, a type and a
// code. It can also contain a fullName which is not returned by Upsilon.js.
export type Record = {
    name: string,
    type: string,
    fullName: string | null,
    code: string,
}

// A storage is returned by the backupStorage function from Upsilon.js. It is
// composed of a list of records and a magik field.
export type Storage = {
    // The magik should always be true. It's used to check if the storage is valid.
    magik: boolean,

    // The list of records in the storage
    records: Record[],
}