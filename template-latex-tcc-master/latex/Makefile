TARGET = output/TCC_FGA.pdf
OUTPUT_DIR = output

BIBTEX = bibtex
LATEX = latex
DVIPS = dvips
PS2PDF = ps2pdf

VERSION = 0.1.0

FIXOS_DIR = fixos
FIXOS_SOURCES = informacoes.tex fichaCatalografica.tex \
		folhaDeAprovacao.tex pacotes.tex comandos.tex setup.tex	\
		listasAutomaticas.tex indiceAutomatico.tex

FIXOS_FILES = $(addprefix $(FIXOS_DIR)/, $(FIXOS_SOURCES))

EDITAVEIS_DIR = editaveis
EDITAVEIS_SOURCES = informacoes.tex errata.tex dedicatoria.tex \
					agradecimentos.tex epigrafe.tex resumo.tex abstract.tex \
					abreviaturas.tex simbolos.tex introducao.tex \
					aspectosgerais.tex consideracoes.tex textoepostexto.tex \
					elementosdotexto.tex elementosdopostexto.tex \
					apendices.tex anexos.tex

EDITAVEIS_FILES = $(addprefix $(EDITAVEIS_DIR)/, $(EDITAVEIS_SOURCES))

MAIN_FILE = tcc.tex
DVI_FILE  = $(addsuffix .dvi, $(basename $(MAIN_FILE)))
AUX_FILE  = $(addsuffix .aux, $(basename $(MAIN_FILE)))
PS_FILE   = $(addsuffix .ps, $(basename $(MAIN_FILE)))
PDF_FILE  = $(addsuffix .pdf, $(basename $(MAIN_FILE)))
OUTPUT_MAIN = $(OUTPUT_DIR)/$(basename $(MAIN_FILE))
OUTPUT_DVI  = $(addsuffix .dvi, $(OUTPUT_MAIN))
OUTPUT_AUX  = $(addsuffix .aux, $(OUTPUT_MAIN))
OUTPUT_PS   = $(addsuffix .ps, $(OUTPUT_MAIN))
OUTPUT_PDF  = $(addsuffix .pdf, $(OUTPUT_MAIN))
OUTPUT_OUTPS = $(addsuffix .out.ps, $(OUTPUT_MAIN))
ROOT_OUTPS = $(basename $(MAIN_FILE)).out.ps

SOURCES = $(FIXOS_FILES) $(EDITAVEIS_FILES)

.PHONY: all clean dist-clean

all: 
	@make $(TARGET)
     
$(TARGET): $(MAIN_FILE) $(SOURCES) bibliografia.bib
	@mkdir -p $(OUTPUT_DIR)
	$(LATEX) -output-directory=$(OUTPUT_DIR) $(MAIN_FILE) $(SOURCES)
	$(BIBTEX) $(OUTPUT_AUX)
	$(LATEX) -output-directory=$(OUTPUT_DIR) $(MAIN_FILE) $(SOURCES)
	$(LATEX) -output-directory=$(OUTPUT_DIR) $(MAIN_FILE) $(SOURCES)
	@cp $(OUTPUT_OUTPS) $(ROOT_OUTPS)
	$(DVIPS) $(OUTPUT_DVI) -o $(OUTPUT_PS)
	$(PS2PDF) $(OUTPUT_PS) $(OUTPUT_PDF)
	@cp $(OUTPUT_PDF) $(TARGET)
	@rm -f $(ROOT_OUTPS)

clean:
	rm -rf $(OUTPUT_DIR)
	rm -f *~ *.dvi *.ps *.backup *.aux *.log
	rm -f *.lof *.lot *.bbl *.blg *.brf *.toc *.idx
	rm -f $(ROOT_OUTPS)
	rm -f *.pdf

dist: clean
	tar vczf tcc-fga-latex-$(VERSION).tar.gz *

dist-clean: clean
	rm -f $(TARGET)
