import sys
import os
import tkinter as tk
from tkinter import filedialog, messagebox
from abc import ABC, abstractmethod
from email_scrn import parse_eml_to_html, take_screenshot


# Add project root to path so we can import visor_base
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))
from visor_base import BaseVisor

# Inherits from base visor
class EmailVisor(BaseVisor):

    def __init__(self, source_path):
        super().__init__(source_path)
        self.name = "CKEmail Visor"

    def render(self, output_path):
        # Starts a display stream 
        print(f"Rendering email from {self.source_path}")

    def get_labels(self):
        return {"type": "email"}

    def run(self):
        return


        


if __name__ == "__main__":
    visor = EmailVisor("./test.eml")
    visor.run()
    
    