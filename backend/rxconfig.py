import reflex as rx

config = rx.Config(
    app_name="telecom_assistant",
    plugins=[
        rx.plugins.SitemapPlugin(),
        rx.plugins.TailwindV4Plugin(),
    ]
)