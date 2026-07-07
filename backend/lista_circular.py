class Nodo:
    def __init__(self, cancion):
        #nombre de la cancion
        self.cancion=cancion
        
        #referencia al siguiente nodo
        self.siguiente=None


        class ListaCircular:
            def __init__(self):
                #primer nodo de la lista
                self.inicio=None

                #metodo para agregar una nueva cancion
                def agregar(self, cancion):
                    nuevo=Nodo(cancion)
                #si la lsita esta vacia
                    if self.inicio is None:
                        self.inicio=nuevo    
                        #el primer nodo se apunta a si mismo

                    return
                #buscar el ultimo nodo
                actual = self.inicio

            