const routes = [
  {
    path: '/',
    component: () => import('layouts/LmsMainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'remote', component: () => import('pages/RemoteClass.vue') },
      { path : 'qr', component: () => import('pages/QrPage.vue')},
      { path : 'practice', component: () => import('pages/PracticePage.vue')},
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
