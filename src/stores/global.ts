import { defineStore } from 'pinia'

export const useGlobalStore = defineStore('global', {
  state: () => ({
    // Error message (i18n string or boolean for generic error)
    error: false as string | boolean,
    // Success message (i18n string or boolean for generic success)
    success: false as string | boolean,
    // True when the username is already taken
    usernameTaken: false,
    // Show the global progress bar (boolean or number between 0 and 100)
    progress: false as boolean | number,
  }),
})
