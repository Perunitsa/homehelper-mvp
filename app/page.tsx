import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-full flex flex-col bg-cream">
      {/* Шапка с акварельным градиентом */}
      <header className="watercolor-gradient px-6 py-16 sm:px-12 sm:py-24 relative overflow-hidden">
        {/* Декоративные элементы — растения */}
        <div className="absolute top-8 right-12 text-6xl opacity-20 breathe hidden sm:block">
          🌿
        </div>
        <div className="absolute bottom-12 left-8 text-4xl opacity-15 sway hidden sm:block">
          🍃
        </div>

        <div className="max-w-4xl mx-auto relative">
          <h1 className="heading-handwritten text-5xl sm:text-7xl text-brown mb-4">
            HomeHelper
          </h1>
          <p className="text-xl sm:text-2xl text-text-secondary max-w-2xl mb-8">
            Ваш уютный помощник для домашних дел. Превращаем рутину в тёплые
            семейные ритуалы.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href="/auth" className="btn-cozy">
              Начать
            </Link>
            <Link href="/auth" className="btn-cozy btn-cozy-secondary">
              Войти
            </Link>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="flex-1 px-6 py-16 sm:px-12">
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Что мы умеем */}
          <section className="fade-in-up">
            <div className="divider-leaf mb-8">
              <span className="text-2xl">🌱</span>
            </div>
            <h2 className="heading-handwritten text-4xl text-brown mb-8">
              Что мы умеем
            </h2>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Квесты */}
              <div className="card-cozy p-6">
                <div className="flex items-start gap-4 mb-4">
                  <span className="text-3xl breathe">📋</span>
                  <h3 className="heading-handwritten text-2xl text-brown">
                    Квесты-задачи
                  </h3>
                </div>
                <p className="text-text-secondary">
                  Домашние дела становятся увлекательными квестами. Назначайте
                  задачи, зарабатывайте очки и открывайте достижения вместе.
                </p>
              </div>

              {/* Покупки */}
              <div className="card-cozy p-6">
                <div className="flex items-start gap-4 mb-4">
                  <span className="text-3xl sway">🛒</span>
                  <h3 className="heading-handwritten text-2xl text-brown">
                    Списки покупок
                  </h3>
                </div>
                <p className="text-text-secondary">
                  Общие списки для всей семьи. Отмечайте нужное, делитесь с
                  близкими — и ничего не забудется в магазине.
                </p>
              </div>

              {/* Инвентарь */}
              <div className="card-cozy p-6">
                <div className="flex items-start gap-4 mb-4">
                  <span className="text-3xl breathe">📦</span>
                  <h3 className="heading-handwritten text-2xl text-brown">
                    Инвентарь продуктов
                  </h3>
                </div>
                <p className="text-text-secondary">
                  Следите за сроками хранения, штрихкодами и категориями.
                  Продукты под контролем, как книги на полке.
                </p>
              </div>

              {/* Геймификация */}
              <div className="card-cozy p-6">
                <div className="flex items-start gap-4 mb-4">
                  <span className="text-3xl sway">⭐</span>
                  <h3 className="heading-handwritten text-2xl text-brown">
                    Мягкая геймификация
                  </h3>
                </div>
                <p className="text-text-secondary">
                  Уровень, опыт, достижения — но без спешки и давления. Тихий
                  прогресс, которым приятно гордиться.
                </p>
              </div>
            </div>
          </section>

          {/* Для кого */}
          <section className="fade-in-up">
            <div className="divider-leaf mb-8">
              <span className="text-2xl">🏡</span>
            </div>
            <h2 className="heading-handwritten text-4xl text-brown mb-8">
              Для кого
            </h2>

            <div className="card-cozy p-8">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-olive text-xl mt-1">🌿</span>
                  <span className="text-text-secondary">
                    <strong>Семьи</strong> — родители и дети работают вместе,
                    каждый вносит свой вклад
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-olive text-xl mt-1">🍃</span>
                  <span className="text-text-secondary">
                    <strong>Пары</strong> — делите быт без споров, с общим
                    пониманием задач
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-olive text-xl mt-1">🪴</span>
                  <span className="text-text-secondary">
                    <strong>Все, кто ценит уют</strong> — кто хочет, чтобы дом
                    был местом тепла, а не хаоса
                  </span>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </main>

      {/* Футер */}
      <footer className="bg-cream-dark px-6 py-12 sm:px-12 border-t border-beige">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-4xl mb-4 sway inline-block">🛋️</div>
          <p className="heading-handwritten text-2xl text-brown mb-2">
            Спасибо, что заглянули!
          </p>
          <p className="text-text-muted text-sm">
            HomeHelper — сделан с любовью к дому
          </p>
        </div>
      </footer>
    </div>
  );
}
