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

const middlewareAuth = middleware.auth({
  guards: ['api', 'web'],
})

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.get('/basicauth', async () => {
  return {
    hello: 'world',
  }
})
//.use(middleware.auth({ guards: ['basicAuth'] }))

router
  .group(() => {
    /**
     * All routes registered inside the callback
     * should only be accessible by admin users
     * This check is currently missing on purpose
     */
    router.get('/users', async ({}) => {
      return User.query()
    })

    router.patch('/users', async ({ request, response }) => {
      // no check if user can be accessed
      // for now just a dummy endpoint for changing some user data

      const { id } = request.body()

      if (!id) {
        return response.status(400).send({})
      }

      return User.findOrFail(id)
    })

    router.get('/users/:id', async ({ params }) => {
      return User.findOrFail(params.id)
    })

    router.get('/usersByQueryString', async ({ request }) => {
      const { id } = request.qs()

      return User.findOrFail(id)
    })
  })
  .use(middlewareAuth)
  .prefix('/admin')

router.post('/login/bearer', async ({ request }) => {
  const { username, password } = request.body()

  //const h = await hash.make(password)

  const user = await User.verifyCredentials(username, password)

  const token = await User.accessTokens.create(
    user, // for user
    ['*'], // with all abilities
    {
      expiresIn: '30 days', // expires in 30 days
    }
  )

  console.log('Login successful')
  return token
  // todo: allow token to be defined in nested property at a later point
  /*return {
    token,
  }*/
})

router.post('/login/cookie', async ({ request, auth }) => {
  const { username, password } = request.body()

  const user = await User.verifyCredentials(username, password)
  await auth.use('web').login(user)

  console.log('Login successful')
})

router
  .post('/logout/cookie', async ({ auth }) => {
    await auth.use('web').logout()
  })
  .use(
    middleware.auth({
      guards: ['web'],
    })
  )
