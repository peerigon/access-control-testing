/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

// import hash from '@adonisjs/core/services/hash'
import router from '@adonisjs/core/services/router'
import User from '#models/user'
import { middleware } from '#start/kernel'

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
  .use(middleware.auth())
  .prefix('/admin')

router.post('/login', async ({ request }) => {
  const { email, password } = request.body()

  //const h = await hash.make(password)

  const user = await User.verifyCredentials(email, password)

  const token = await User.accessTokens.create(
    user, // for user
    ['*'], // with all abilities
    {
      expiresIn: '30 days', // expires in 30 days
    }
  )

  console.log('Login successful ')
  return token
  // todo: allow token to be defined in nested property at a later point
  /*return {
    token,
  }*/
})
