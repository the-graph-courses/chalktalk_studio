import os
from shiny import App, render, ui, reactive
import subprocess
import presentation_utils as pu
from pathlib import Path
import shutil
from presentation_utils import generate_slides, format_presentation_for_qmd

# Add near the top with other imports
chalktalk_demo = open("assets/chalktalk_demo_for_llm.qmd").read()

app_ui = ui.page_fluid(
    ui.tags.head(
        ui.tags.style(
            """
            .sidebar { background-color: #f8f9fa; padding: 20px; border-radius: 10px; }
            .main-content { padding: 20px; }
            .btn-primary { margin: 10px 0; }
            .form-control { margin: 10px 0; }
            h3, h4 { color: #2c3e50; margin-bottom: 20px; }
        """
        )
    ),
    ui.layout_sidebar(
        ui.sidebar(
            ui.h3("Chalktalk Demo", class_="text-center"),
            ui.input_text(
                "title",
                "Presentation Title",
                placeholder="Enter a title for your presentation",
                width="100%",
            ),
            ui.input_text_area(
                "prompt",
                "What would you like me to teach?",
                rows=5,
                placeholder="Enter your topic or learning objectives here...",
                width="100%",
            ),
            ui.input_numeric(
                "num_slides", "Number of Slides", value=10, min=1, max=20, width="100%"
            ),
            ui.input_action_button(
                "generate_qmd",
                "Generate Presentation",
                class_="btn-primary btn-lg w-100",
            ),
            ui.br(),
            ui.input_action_button(
                "render_presentation",
                "Render Presentation",
                class_="btn-success btn-lg w-100",
            ),
        ),
        ui.div(
            {"class": "main-content"},
            ui.h4("Generated Presentation Content"),
            ui.output_text("current_directory"),
            ui.input_text_area(
                "qmd_editor",
                "",
                rows=20,
                placeholder="Your presentation content will appear here. Feel free to edit before rendering.",
                width="100%",
            ),
            ui.br(),
            ui.output_ui("presentation_link"),
            ui.output_text("processing_status"),
        ),
    ),
)


def server(input, output, session):
    # Reactive values to store current presentation info
    current_presentation = reactive.Value(
        {"base_dir": None, "media_dir": None, "html_path": None}
    )

    @reactive.effect
    @reactive.event(input.render_presentation)
    def _():
        with ui.Progress(min=0, max=100) as p:
            p.set(message="Starting presentation generation", value=0)

            # Create presentation directory if not exists
            title = input.title() or "presentation"
            if not current_presentation.get()["base_dir"]:
                base_dir, media_dir = pu.create_presentation_directory(title)
                current_presentation.set(
                    {"base_dir": base_dir, "media_dir": media_dir, "html_path": None}
                )

            # Get current directory info
            current_info = current_presentation.get()
            base_dir = current_info["base_dir"]
            media_dir = current_info["media_dir"]

            # Save QMD content
            p.set(message="Saving QMD file", value=10)
            qmd_path = os.path.join(base_dir, "presentation.qmd")
            with open(qmd_path, "w") as f:
                f.write(input.qmd_editor())

            # Render QMD to HTML
            p.set(message="Rendering QMD to HTML", value=20)
            subprocess.run(["quarto", "render", qmd_path], check=True)

            # Process HTML with media
            p.set(message="Processing media elements", value=30)
            html_path = qmd_path.replace(".qmd", ".html")
            with open(html_path, "r", encoding="utf-8") as f:
                html_content = f.read()

            # Extract and process fragments
            p.set(message="Generating audio", value=40)
            fragments, modified_html = pu.extract_media_fragments(html_content)
            processed_fragments = pu.process_media_fragments(
                fragments, media_dir, base_dir
            )

            # Update HTML with media elements
            p.set(message="Finalizing presentation", value=80)
            modified_html = pu.insert_media_elements(modified_html, processed_fragments)
            final_html = pu.modify_html_for_autoslide_and_controls(modified_html)

            # Save final HTML
            output_html = os.path.join(base_dir, "presentation_final.html")
            with open(output_html, "w", encoding="utf-8") as f:
                f.write(final_html)

            # Update current presentation info
            current_info["html_path"] = output_html
            current_presentation.set(current_info)

            p.set(message="Complete!", value=100)

    @reactive.effect
    @reactive.event(input.generate_qmd)
    def _():
        # Generate presentation content
        presentation = generate_slides(
            topic=input.prompt(),
            title=input.title(),
            num_slides=input.num_slides(),
            chalktalk_demo=chalktalk_demo,
        )

        # Format as QMD
        qmd_content = format_presentation_for_qmd(presentation)

        # Update the editor with the generated content
        ui.update_text("qmd_editor", value=qmd_content)

    @output
    @render.text
    def current_directory():
        current_info = current_presentation.get()
        if current_info["base_dir"]:
            return f"Working Directory: {current_info['base_dir']}"
        return ""

    @output
    @render.ui
    def presentation_link():
        current_info = current_presentation.get()
        if current_info["html_path"] and os.path.exists(current_info["html_path"]):
            return ui.div(
                ui.tags.a(
                    "Download Presentation",
                    href=current_info["html_path"],
                    download="presentation.html",
                    target="_blank",
                    class_="btn btn-success",
                ),
                ui.tags.p(
                    f"Presentation saved in: {current_info['base_dir']}",
                    style="margin-top: 10px;",
                ),
            )
        return None

    @output
    @render.text
    def processing_status():
        current_info = current_presentation.get()
        if current_info["html_path"]:
            return "Processing complete!"
        elif current_info["base_dir"]:
            return "Ready to render presentation..."
        return ""


app = App(app_ui, server)
