/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import User from '#models/user'

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router
  .group(() => {
    /**
     * All routes registered inside the callback
     * should only be accessible by admin users
     * This check is currently missing on purpose
     */
    router.get('/users', async () => {
      return User.query()
    })

    router.get('/users/:id', async ({ params }) => {
      return User.findOrFail(params.id)
    })
  })
  .prefix('/admin')
