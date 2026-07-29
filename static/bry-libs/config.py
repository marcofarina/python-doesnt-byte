class Config():
    BRYTHON_COMMUNICATOR = 'py_id'
    CANVAS_OUTPUT = False
    CANVAS_ID = f'id_canvas'
    GRAPHICS_ID = f'id_graphics'
    TURTLE_SVG_CONTAINER = f'id_svg'
    OUTPUT_DIV = f'id_brython_result'
    # node_id grezzo: serve a PyQuest per fare notify() sullo stesso div che
    # bryBridge ascolta (py_<node_id>). Gli altri campi sono id DOM derivati.
    NODE_ID = 'id'

    @staticmethod
    def set_id(node_id):
        Config.NODE_ID = node_id
        Config.BRYTHON_COMMUNICATOR = f'py_{node_id}'
        Config.CANVAS_ID = f'{node_id}_canvas'
        Config.GRAPHICS_ID = f'{node_id}_graphics'
        Config.TURTLE_SVG_CONTAINER = f'{node_id}_svg'
        Config.OUTPUT_DIV = f'{node_id}_brython_result'